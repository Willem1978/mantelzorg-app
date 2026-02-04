import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface IntakeAnswer {
  questionId: string
  value: string
  score?: number
}

interface IntakeBody {
  answers: Record<string, string>
}

// POST - Save intake responses
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Je moet ingelogd zijn om de intake op te slaan" },
        { status: 401 }
      )
    }

    const body: IntakeBody = await request.json()

    if (!body.answers || Object.keys(body.answers).length === 0) {
      return NextResponse.json(
        { error: "Geen antwoorden ontvangen" },
        { status: 400 }
      )
    }

    // Get the caregiver profile for this user
    const caregiver = await prisma.caregiver.findUnique({
      where: { userId: session.user.id }
    })

    if (!caregiver) {
      return NextResponse.json(
        { error: "Geen mantelzorger profiel gevonden" },
        { status: 404 }
      )
    }

    // Convert answers to score values for FOUR_CHOICE questions
    // "helemaal_mee_eens" = 4, "mee_eens" = 3, "niet_mee_eens" = 2, "helemaal_niet_mee_eens" = 1
    const scoreMap: Record<string, number> = {
      "helemaal_mee_eens": 4,
      "mee_eens": 3,
      "niet_mee_eens": 2,
      "helemaal_niet_mee_eens": 1,
    }

    // Prepare intake responses
    const intakeResponses: IntakeAnswer[] = Object.entries(body.answers).map(
      ([questionId, value]) => ({
        questionId,
        value,
        score: scoreMap[value] ?? null,
      })
    )

    // Save all responses in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete any existing responses for this caregiver (to allow re-taking intake)
      await tx.intakeResponse.deleteMany({
        where: { caregiverId: caregiver.id }
      })

      // Create new responses
      for (const response of intakeResponses) {
        // First check if the question exists, if not create it dynamically
        let question = await tx.intakeQuestion.findFirst({
          where: { id: response.questionId }
        })

        if (!question) {
          // Get or create a default category for dynamically created questions
          let defaultCategory = await tx.intakeCategory.findFirst({
            where: { name: "Algemeen" }
          })

          if (!defaultCategory) {
            defaultCategory = await tx.intakeCategory.create({
              data: {
                name: "Algemeen",
                description: "Algemene intake vragen",
                order: 0
              }
            })
          }

          // Create the question
          question = await tx.intakeQuestion.create({
            data: {
              id: response.questionId,
              categoryId: defaultCategory.id,
              question: `Vraag ${response.questionId}`,
              type: response.score !== null ? "SCALE" : "TEXT",
              order: 0
            }
          })
        }

        await tx.intakeResponse.create({
          data: {
            caregiverId: caregiver.id,
            questionId: response.questionId,
            value: response.value,
            score: response.score,
          }
        })
      }

      // Mark intake as completed
      await tx.caregiver.update({
        where: { id: caregiver.id },
        data: {
          intakeCompleted: true,
          onboardedAt: new Date(),
        }
      })
    })

    return NextResponse.json({
      success: true,
      message: "Intake opgeslagen",
    })

  } catch (error) {
    console.error("Intake save error:", error)
    return NextResponse.json(
      { error: "Er ging iets mis bij het opslaan van de intake" },
      { status: 500 }
    )
  }
}

// GET - Get intake responses for current user
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Je moet ingelogd zijn" },
        { status: 401 }
      )
    }

    const caregiver = await prisma.caregiver.findUnique({
      where: { userId: session.user.id },
      include: {
        intakeResponses: {
          include: {
            question: {
              include: {
                category: true
              }
            }
          }
        }
      }
    })

    if (!caregiver) {
      return NextResponse.json(
        { error: "Geen mantelzorger profiel gevonden" },
        { status: 404 }
      )
    }

    // Group responses by category
    const responsesByCategory = caregiver.intakeResponses.reduce((acc, response) => {
      const categoryName = response.question.category.name
      if (!acc[categoryName]) {
        acc[categoryName] = {
          categoryId: response.question.categoryId,
          categoryName,
          responses: [],
          averageScore: 0,
        }
      }
      acc[categoryName].responses.push({
        questionId: response.questionId,
        question: response.question.question,
        value: response.value,
        score: response.score,
      })
      return acc
    }, {} as Record<string, any>)

    // Calculate average scores per category
    Object.values(responsesByCategory).forEach((category: any) => {
      const scores = category.responses
        .filter((r: any) => r.score !== null)
        .map((r: any) => r.score)
      category.averageScore = scores.length > 0
        ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length
        : null
    })

    return NextResponse.json({
      intakeCompleted: caregiver.intakeCompleted,
      completedAt: caregiver.onboardedAt,
      categories: Object.values(responsesByCategory),
    })

  } catch (error) {
    console.error("Intake fetch error:", error)
    return NextResponse.json(
      { error: "Er ging iets mis bij het ophalen van de intake" },
      { status: 500 }
    )
  }
}
