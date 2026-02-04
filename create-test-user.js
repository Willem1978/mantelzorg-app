/**
 * Script om een test gebruiker aan te maken
 * Run met: node create-test-user.js
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createTestUser() {
  console.log('🔧 Test gebruiker aanmaken...\n')

  const email = 'test@mantelzorg.nl'
  const password = 'test1234'
  const name = 'Test Gebruiker'
  const phoneNumber = '+31619323793' // Jouw nummer

  try {
    // Check of gebruiker al bestaat
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      console.log('⚠️  Gebruiker bestaat al!')
      console.log(`📧 Email: ${email}`)
      console.log(`🔑 Wachtwoord: ${password}`)
      console.log(`\n👉 Login op: https://kacie-uncowed-queenie.ngrok-free.dev/login`)

      // Update caregiver met telefoonnummer
      const caregiver = await prisma.caregiver.findUnique({
        where: { userId: existingUser.id },
      })

      if (caregiver) {
        await prisma.caregiver.update({
          where: { id: caregiver.id },
          data: { phoneNumber },
        })
        console.log(`📱 Telefoonnummer bijgewerkt: ${phoneNumber}`)
      }

      return
    }

    // Hash wachtwoord
    const hashedPassword = await bcrypt.hash(password, 10)

    // Maak gebruiker aan
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: 'CAREGIVER',
        emailVerified: new Date(), // Alvast geverifieerd voor testing
      },
    })

    console.log('✅ Gebruiker aangemaakt!')
    console.log(`👤 Naam: ${name}`)
    console.log(`📧 Email: ${email}`)
    console.log(`🔑 Wachtwoord: ${password}`)

    // Maak caregiver profiel aan
    const caregiver = await prisma.caregiver.create({
      data: {
        userId: user.id,
        phoneNumber,
        intakeCompleted: false,
      },
    })

    console.log(`\n✅ Caregiver profiel aangemaakt!`)
    console.log(`📱 Telefoonnummer: ${phoneNumber}`)

    console.log(`\n🎉 Klaar!`)
    console.log(`\n👉 Login op: https://kacie-uncowed-queenie.ngrok-free.dev/login`)
    console.log(`   Email: ${email}`)
    console.log(`   Wachtwoord: ${password}`)

  } catch (error) {
    console.error('❌ Fout:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUser()
