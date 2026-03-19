export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "https://pennydrop.pages.dev",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // 1. Handle the browser's "Preflight" check
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // 2. Only allow POST requests for the game
    if (request.method !== "POST") {
      return new Response("Penny Drop API Active", { status: 200 });
    }

    try {
      const { guess, currentStage, puzzleId } = await request.json();
      const puzzle = await env.PUZZLE_STORE.get(puzzleId, { type: "json" });

      if (!puzzle) {
        return new Response(JSON.stringify({ error: "Puzzle not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Initial Load
      if (currentStage === -1) {
        return new Response(JSON.stringify({
          newClue: puzzle.stages["0"],
          category: puzzle.category,
          nextStage: 0
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Check Guess
      const cleanGuess = guess.toUpperCase().trim();
      if (cleanGuess === puzzle.answer.toUpperCase().trim()) {
        return new Response(JSON.stringify({
          solved: true,
          message: "Penny Drop!",
          answer: puzzle.answer
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const nextStage = currentStage + 1;
      return new Response(JSON.stringify({
        solved: false,
        nextStage: nextStage,
        newClue: nextStage > 5 ? null : puzzle.stages[nextStage.toString()],
        category: puzzle.category,
        gameOver: nextStage > 5,
        answer: nextStage > 5 ? puzzle.answer : null
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
};
