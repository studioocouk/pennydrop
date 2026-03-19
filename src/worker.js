export default {
  async fetch(request, env) {
    // 1. Define our "Security Pass" (CORS Headers)
    const corsHeaders = {
      "Access-Control-Allow-Origin": "https://pennydrop.pages.dev",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // 2. Handle the Browser's "Preflight" Check (OPTIONS)
    if (request.method === "OPTIONS") {
      return new Response(null, { 
        status: 204, 
        headers: corsHeaders 
      });
    }

    // 3. Only allow POST requests for the actual game logic
    if (request.method !== "POST") {
      return new Response("Penny Drop API is active.", { 
        status: 200,
        headers: { "Content-Type": "text/plain" }
      });
    }

    try {
      const { guess, currentStage, puzzleId } = await request.json();
      
      // 4. Pull the puzzle from KV
      const puzzle = await env.PUZZLE_STORE.get(puzzleId, { type: "json" });

      if (!puzzle) {
        return new Response(JSON.stringify({ error: "Puzzle not found" }), { 
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // 5. Build the Response Data
      let responseData;
      
      if (currentStage === -1) {
        // Initial Game Load
        responseData = {
          newClue: puzzle.stages["0"],
          category: puzzle.category,
          nextStage: 0
        };
      } else {
        // Guess Logic
        const cleanGuess = guess.toUpperCase().trim();
        const isCorrect = cleanGuess === puzzle.answer.toUpperCase().trim();
        const nextStage = currentStage + 1;
        const gameOver = nextStage > 5;

        responseData = isCorrect ? {
          solved: true,
          message: "Penny Drop! You got it!",
          answer: puzzle.answer
        } : {
          solved: false,
          nextStage: nextStage,
          newClue: gameOver ? null : puzzle.stages[nextStage.toString()],
          category: puzzle.category,
          gameOver: gameOver,
          answer: gameOver ? puzzle.answer : null
        };
      }

      // 6. Return response with CORS headers
      return new Response(JSON.stringify(responseData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
};
