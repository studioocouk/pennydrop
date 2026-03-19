export default {
  async fetch(request, env) {
    // 1. Safety Guard: Browser visits (GET) shouldn't crash the Worker
    if (request.method !== "POST") {
      return new Response("Penny Drop API is active. Play at the main URL.", { 
        status: 200,
        headers: { "Content-Type": "text/plain" }
      });
    }

    try {
      // 2. Parse the request from the frontend
      const { guess, currentStage, puzzleId } = await request.json();

      // 3. Fetch the puzzle from your KV Store
      const puzzle = await env.PUZZLE_STORE.get(puzzleId, { type: "json" });

      if (!puzzle) {
        return new Response(JSON.stringify({ error: "Puzzle not found for ID: " + puzzleId }), { 
          status: 404,
          headers: { "Content-Type": "application/json" }
        });
      }

      // 4. Initial Load Logic (Stage -1)
      if (currentStage === -1) {
        return new Response(JSON.stringify({
          solved: false,
          nextStage: 0,
          newClue: puzzle.stages["0"],
          category: puzzle.category
        }), { headers: { "Content-Type": "application/json" } });
      }

      // 5. Check the Guess
      const cleanGuess = guess.toUpperCase().trim();
      const cleanAnswer = puzzle.answer.toUpperCase().trim();

      if (cleanGuess === cleanAnswer) {
        return new Response(JSON.stringify({
          solved: true,
          message: "Penny Drop! You got it!",
          answer: puzzle.answer
        }), { headers: { "Content-Type": "application/json" } });
      }

      // 6. Handle Wrong Guess / Move to Next Stage
      const nextStage = currentStage + 1;
      const gameOver = nextStage > 5;

      return new Response(JSON.stringify({
        solved: false,
        nextStage: nextStage,
        newClue: gameOver ? null : puzzle.stages[nextStage.toString()],
        category: puzzle.category,
        gameOver: gameOver,
        answer: gameOver ? puzzle.answer : null
      }), { headers: { "Content-Type": "application/json" } });

    } catch (err) {
      // Catch-all for JSON parsing errors or other crashes
      return new Response(JSON.stringify({ error: err.message }), { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
};
