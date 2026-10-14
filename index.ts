import { experimental_evaluate as evaluate, createGateway } from "ai";

const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY,
});

(async () => {
  const result = await evaluate({
    model: gateway.evaluationModel("typesafe-ai/jev"),
    state: "The student demonstrated clear understanding of asymptotic notation, explained Big-O and Theta concepts accurately, and answered follow-up questions confidently.",
    questions: {
      passed: {
        type: "boolean",
        instructions: "Did the student demonstrate passing understanding of the topic?",
      },
      clarity: {
        type: "score",
        instructions: "Rate the student's communication clarity from poor to excellent.",
        criteria: ["Poor", "Fair", "Good", "Excellent"],
      },
      category: {
        type: "choice",
        instructions: "Categorize the student's performance level.",
        criteria: {
          needs_improvement: "Needs improvement in fundamental concepts",
          satisfactory: "Satisfactory grasp of concepts",
          exemplary: "Exemplary understanding and confidence",
        },
      },
    },
  });

  console.log("Evaluation Results:\n", JSON.stringify(result.answers, null, 2));
})();
