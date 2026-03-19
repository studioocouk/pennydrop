export default {
  async fetch(request, env) {
    // 1. Parse the player's request
    const { guess, currentStage, puzzleId } = await request.json();

    // 2. Fetch today's puzzle from Cloudflare KV
    const puzzle = await env.PUZZLE_STORE.get(puzzleId, { type: "json" });
    if (!puzzle) return new Response("Puzzle not found", { status: 404 });

    // 3. Normalize the guess (UK English, Uppercase, Trim)
    const cleanGuess = guess.toUpperCase().trim();
    const cleanAnswer = puzzle.answer.toUpperCase().trim();

    // 4. Check the answer
    if (cleanGuess === cleanAnswer) {
      return new Response(JSON.stringify({
        solved: true,
        message: "Penny Drop! You got it!",
        points: 500 - (currentStage * 100) // Reward earlier solves
      }));
    }

    // 5. If wrong, return ONLY the next stage of data
    const nextStage = currentStage + 1;
    if (nextStage > 5) {
      return new Response(JSON.stringify({ solved: false, gameOver: true, answer: puzzle.answer }));
    }

    return new Response(JSON.stringify({
      solved: false,
      nextStage: nextStage,
      newClue: puzzle.stages[nextStage.toString()]
    }));
  }
};
