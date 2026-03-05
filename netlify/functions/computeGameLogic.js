exports.handler = async (event, context) => {
  try {
    const data = JSON.parse(event.body); // Input data from the app
    const result = performHeavyComputation(data); // Your computation logic
    return {
      statusCode: 200,
      body: JSON.stringify({ result }),
    };
  } catch (error) {
    console.error("Error in computeGameLogic:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};

function performHeavyComputation(data) {
  // Example computation logic
  const score = data.score + 10; // Add 10 points
  return { score };
}
