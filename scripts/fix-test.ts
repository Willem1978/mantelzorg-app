import { prisma } from '../src/lib/prisma';

async function main() {
  // Haal de caregiver ID voor Willem
  const caregiver = await prisma.caregiver.findFirst({
    where: {
      user: {
        name: { contains: 'Willem' }
      }
    }
  });

  if (!caregiver) {
    console.log('Geen caregiver gevonden');
    return;
  }

  console.log('Caregiver ID:', caregiver.id);

  // Verwijder oude tests
  await prisma.belastbaarheidTest.deleteMany({
    where: { caregiverId: caregiver.id }
  });
  console.log('Oude tests verwijderd');

  // Maak een nieuwe test met taakSelecties
  const test = await prisma.belastbaarheidTest.create({
    data: {
      caregiverId: caregiver.id,
      voornaam: 'Willem',
      email: 'willem@test.nl',
      postcode: '1234AB',
      huisnummer: '1',
      totaleBelastingScore: 15,
      belastingNiveau: 'HOOG',
      totaleZorguren: 20,
      isCompleted: true,
      completedAt: new Date(),
      antwoorden: {
        create: [
          { vraagId: 'q1', vraagTekst: 'Slaap je minder goed door de zorg?', antwoord: 'ja', score: 2, gewicht: 1.5 },
          { vraagId: 'q2', vraagTekst: 'Heb je last van je lichaam door het zorgen?', antwoord: 'soms', score: 1, gewicht: 1.0 },
          { vraagId: 'q3', vraagTekst: 'Kost het zorgen veel tijd en energie?', antwoord: 'ja', score: 2, gewicht: 1.0 },
          { vraagId: 'q4', vraagTekst: 'Is de band met je naaste veranderd?', antwoord: 'soms', score: 1, gewicht: 1.5 },
          { vraagId: 'q5', vraagTekst: 'Maakt het gedrag van je naaste je verdrietig?', antwoord: 'ja', score: 2, gewicht: 1.5 },
          { vraagId: 'q6', vraagTekst: 'Heb je verdriet dat je naaste anders is?', antwoord: 'ja', score: 2, gewicht: 1.0 },
        ]
      },
      taakSelecties: {
        create: [
          { taakId: 't1', taakNaam: 'Administratie en geldzaken', isGeselecteerd: true, urenPerWeek: 6, moeilijkheid: 'MOEILIJK' },
          { taakId: 't2', taakNaam: 'Regelen en afspraken maken', isGeselecteerd: true, urenPerWeek: 3, moeilijkheid: 'GEMIDDELD' },
          { taakId: 't3', taakNaam: 'Boodschappen doen', isGeselecteerd: true, urenPerWeek: 4, moeilijkheid: 'MAKKELIJK' },
          { taakId: 't4', taakNaam: 'Bezoek en gezelschap', isGeselecteerd: true, urenPerWeek: 5, moeilijkheid: 'GEMIDDELD' },
          { taakId: 't5', taakNaam: 'Vervoer naar afspraken', isGeselecteerd: true, urenPerWeek: 2, moeilijkheid: 'MOEILIJK' },
        ]
      }
    },
    include: {
      taakSelecties: true,
      antwoorden: true
    }
  });

  console.log('\nNieuwe test aangemaakt:', test.id);
  console.log('Score:', test.totaleBelastingScore);
  console.log('Niveau:', test.belastingNiveau);
  console.log('Antwoorden:', test.antwoorden.length);
  console.log('TaakSelecties:', test.taakSelecties.length);
  test.taakSelecties.forEach(t => {
    console.log('  -', t.taakNaam, '| moeilijkheid:', t.moeilijkheid, '| geselecteerd:', t.isGeselecteerd);
  });
}

main();
