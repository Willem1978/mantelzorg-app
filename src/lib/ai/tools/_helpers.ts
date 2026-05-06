/**
 * Helpers voor tool-implementaties. Voornaamste doel: gestructureerde
 * foutafhandeling zodat een crashende tool niet de hele chat-stream omver
 * gooit. Het model krijgt een leesbare foutmelding terug die het kan
 * omarmen ("Sorry, dat lukte even niet — kunnen we iets anders proberen?")
 * zonder dat de gebruiker een lege bubbel of error-toast ziet.
 */

export type ToolFout = {
  fout: true
  bericht: string
  toolName: string
}

/**
 * Wrap een tool-execute in een try/catch. Bij een fout logt naar console.error
 * en retourneer een gestructureerd fout-object dat het model als gewone
 * tool-output kan verwerken.
 *
 * Gebruik:
 *   execute: async (params) => safeExecute("toolNaam", async () => {
 *     ...bestaande tool-logica...
 *   })
 */
export async function safeExecute<T>(
  toolName: string,
  fn: () => Promise<T>,
): Promise<T | ToolFout> {
  try {
    return await fn()
  } catch (err) {
    const bericht = err instanceof Error ? err.message : "onbekende fout"
    console.error(`[Tool ${toolName}] fout:`, err)
    return { fout: true, bericht, toolName }
  }
}
