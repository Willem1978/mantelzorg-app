/**
 * Balanstest pagina teksten.
 */

export const balanstestContent = {
  title: "Balanstest",
  subtitle: "Hier zie je je scores van elke keer dat je de test hebt gedaan.",
  intro: "Ontdek hoe het met je gaat en waar je hulp bij kunt krijgen.",

  nieuweTest: {
    title: "Tijd voor een nieuwe balanstest",
    tekstFn: (dagen: number) => `Je laatste test was ${dagen} dagen geleden. Het is goed om elke 3 maanden te checken hoe het gaat.`,
    button: "Doe de balanstest",
  },

  geenTest: {
    title: "Nog geen test gedaan",
    beschrijving: "Doe de balanstest om te zien hoe het met je gaat.",
    button: "Doe de balanstest",
  },
} as const
