
async function generatePlan() {
  const goal = document.getElementById("goalInput").value.trim();
  const output = document.getElementById("planOutput");

  if (!goal) {
    output.value = "Please enter a clear goal!";
    return;
  }

  output.value = "Creating your 30-day plan…";

  try {
    const res = await fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      output.value =
        data.error || "Error from server. Check API key / logs in Vercel.";
      return;
    }

    output.value = data.plan || "Could not generate steps. Try again.";
  } catch (err) {
    console.error(err);
    output.value = "Network error. Please try again.";
  }
}
