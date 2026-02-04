/**
 * Script om snel test accounts aan te maken voor WhatsApp testers
 * Run met: node create-tester.js "+31612345678" "Jan Jansen"
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createTester() {
  const args = process.argv.slice(2)

  if (args.length < 2) {
    console.log('❌ Gebruik: node create-tester.js "+31612345678" "Naam"')
    console.log('\nVoorbeeld:')
    console.log('  node create-tester.js "+31612345678" "Jan Jansen"')
    process.exit(1)
  }

  const phoneNumber = args[0]
  const name = args[1]
  const email = `${phoneNumber.replace(/\D/g, '')}@test.mantelzorg.nl`
  const password = 'test1234'

  console.log('🔧 Test account aanmaken...\n')
  console.log(`📱 Telefoonnummer: ${phoneNumber}`)
  console.log(`👤 Naam: ${name}`)
  console.log(`📧 Email: ${email}`)

  try {
    // Check of gebruiker al bestaat
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      console.log('\n⚠️  Gebruiker bestaat al!')

      // Update caregiver met telefoonnummer
      const caregiver = await prisma.caregiver.findUnique({
        where: { userId: existingUser.id },
      })

      if (caregiver) {
        await prisma.caregiver.update({
          where: { id: caregiver.id },
          data: { phoneNumber },
        })
        console.log(`✅ Telefoonnummer bijgewerkt: ${phoneNumber}`)
      }

      console.log(`\n📧 Email: ${email}`)
      console.log(`🔑 Wachtwoord: ${password}`)
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
        emailVerified: new Date(),
      },
    })

    console.log('\n✅ Gebruiker aangemaakt!')

    // Maak caregiver profiel aan
    await prisma.caregiver.create({
      data: {
        userId: user.id,
        phoneNumber,
        intakeCompleted: false,
      },
    })

    console.log('✅ Caregiver profiel aangemaakt!')

    console.log('\n📋 Login gegevens:')
    console.log(`   Email: ${email}`)
    console.log(`   Wachtwoord: ${password}`)

    console.log('\n📱 WhatsApp Setup voor tester:')
    console.log('   1. Stuur via WhatsApp naar: +1 415 523 8886')
    console.log('   2. Stuur het bericht: join fifty-weather')
    console.log('   3. Wacht op bevestiging')
    console.log('   4. Stuur een willekeurig bericht om te starten!')

  } catch (error) {
    console.error('❌ Fout:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

createTester()
