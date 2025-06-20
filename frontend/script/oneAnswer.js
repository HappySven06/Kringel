import createFetch from "./utils/createFetch.js";

document.addEventListener("DOMContentLoaded", () => {
  function getParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      teamId: params.get("teamId")?.trim(),
      questionId: params.get("questionId")?.trim(),
      attemptId: params.get("attemptId")?.trim()
    };
  }

  // Helper: fetch team info and update the heading.
  async function updateTeamHeading(teamId, testName = null) {
    try {
      const teamData = await createFetch(`/team/team/${teamId}`, "GET");
      console.log("Fetched teamData:", teamData);
      // Check for both 'name' and 'teamName'
      const teamName = teamData?.name || teamData?.teamName || "Tiimi nimi";
      const teamNameElement = document.querySelector("#teamName h1");
      if (teamNameElement) {
        teamNameElement.textContent = testName ? `${teamName} - ${testName}` : teamName;
      }
    } catch (error) {
      console.error("Error fetching team info:", error);
      // Optionally leave default heading.
    }
  }

  async function loadAllTeamAnswers(teamId, attemptIdFromURL) {
    try {
      const { answers } = await createFetch("/team/answers", "GET");
      const { tests } = await createFetch("/test/tests", "GET");
      const { attempts } = await createFetch("/team/attempts", "GET");

      let teamAnswers;
      if (attemptIdFromURL) {
        // Use the provided attemptId.
        teamAnswers = answers.filter(answer => String(answer.attemptId) === String(attemptIdFromURL));
      } else {
        // Include all answers from attempts belonging to this team.
        teamAnswers = answers.filter(answer => {
          const att = attempts.find(a => a.id === answer.attemptId);
          return att && String(att.teamId) === String(teamId);
        });
      }

      console.log("Loaded answers:", answers);
      console.log("Team answers:", teamAnswers);

      if (teamAnswers.length === 0) {
        document.querySelector(".answer-container").innerHTML = "<p>Sellel tiimil ei ole vastuseid.</p>";
        return;
      }

      // Determine an attempt for test info.
      let attemptForTest;
      if (attemptIdFromURL) {
        attemptForTest = attempts.find(a => String(a.id) === String(attemptIdFromURL));
      } else {
        attemptForTest = attempts.find(a => String(a.teamId) === String(teamId));
      }
      if (!attemptForTest) throw new Error("Attempt for test not found");

      const test = tests.find(t => t.id === attemptForTest.testId);
      if (!test) throw new Error("Test not found");

      // Update the team heading.
      await updateTeamHeading(teamId, test.name);

      // Sort answers by questionId.
      const sortedAnswers = teamAnswers.sort((a, b) => {
        return a.questionId.localeCompare(b.questionId);
      });

      // Add placeholders for missing answers if necessary.
      const totalQuestions = test.questions ? Number(test.questions) : sortedAnswers.length;
      if (sortedAnswers.length < totalQuestions) {
        const missingCount = totalQuestions - sortedAnswers.length;
        for (let i = 0; i < missingCount; i++) {
          sortedAnswers.push({
            id: null,
            attemptId: attemptForTest.id,
            questionId: `missing-${i}`,
            answer: null,
            team_name: null,
            question_text: "(küsimus puudub või sellele pole vastatud)"
          });
        }
      }

      // Display the first answer (or placeholder) and create navigation buttons.
      await displayAnswer(sortedAnswers[0], teamId, test.name, 1, sortedAnswers.length);
      createNavigationButtons(sortedAnswers, 0, teamId, test.name);
    } catch (err) {
      console.error("❌ Error loading data:", err);
      document.querySelector(".answer-container").innerHTML = "<p>Viga andmete laadimisel.</p>";
    }
  }

  async function loadSingleAnswer(teamId, questionId) {
    try {
      const { answers } = await createFetch("/team/answers", "GET");
      const answer = answers.find(item =>
        String(item.teamId) === teamId &&
        (String(item.questionId) === questionId || String(item.variantId) === questionId)
      );
      if (!answer) {
        document.querySelector(".answer-container").innerHTML = "<p>Vastus ei leitud.</p>";
        return;
      }
      // Update team heading before displaying answer.
      await updateTeamHeading(teamId);
      await displayAnswer(answer, teamId, null, 1, 1);
    } catch (err) {
      console.error("❌ Error loading answer:", err);
      document.querySelector(".answer-container").innerHTML = "<p>Viga vastuse laadimisel.</p>";
    }
  }

  async function displayAnswer(answer, teamId, testName = null, questionNumber = 1, totalQuestions = 1) {
    try {
      // Retrieve team name (from answer.team_name if available, otherwise fetch team info).
      let teamName = answer.team_name;
      if (!teamName) {
        try {
          const teamData = await createFetch(`/team/team/${teamId}`, "GET");
          console.log("Fetched teamData in displayAnswer:", teamData);
          teamName = teamData?.name || teamData?.teamName || "Tiimi nimi";
        } catch {
          teamName = "Tiimi nimi";
        }
      }
      // Retrieve question text.
      let questionText = answer.question_text;
      if (!questionText) {
        try {
          const questionData = await createFetch(`/question/${answer.questionId}`, "GET");
          questionText = questionData?.description || "Küsimus";
        } catch {
          questionText = "Küsimus";
        }
      }
      // Update the heading (redundant if already updated, but safe).
      const teamNameElement = document.querySelector("#teamName h1");
      if (teamNameElement) {
        teamNameElement.textContent = testName ? `${teamName} - ${testName}` : teamName;
      }
      // Display question.
      const questionElement = document.querySelector(".question");
      if (questionElement) {
        questionElement.textContent = `${questionNumber}. ${questionText}`;
      }
      const answerText = document.getElementById("answer-text");
      const answerImg = document.getElementById("answer-image");
      let finalAnswer = answer.answer;
      if (!finalAnswer && answer.variantId) {
        try {
          const variantData = await createFetch(`/variant/${answer.variantId}`, "GET");
          finalAnswer = variantData?.content || variantData?.value || null;
        } catch (err) {
          console.warn("❗ Could not get variant:", err);
        }
      }
      if (answerText && answerImg) {
        if (finalAnswer?.startsWith("data:image")) {
          answerImg.src = finalAnswer;
          answerImg.style.display = "block";
          answerText.textContent = "";
        } else {
          answerImg.style.display = "none";
          answerText.textContent = finalAnswer ?? "(puudub)";
        }
      }
      const metaElement = document.querySelector(".meta");
      if (metaElement) {
        metaElement.textContent = `Punktid: ${answer.points ?? "hindamata"} | Küsimus ${questionNumber} / ${totalQuestions}`;
      }
    } catch (err) {
      console.error("❌ Error displaying answer:", err);
    }
  }

  function createNavigationButtons(answers, currentIndex, teamId, testName = null) {
    const container = document.querySelector(".answer-container");
    if (!container) return;
    // Remove any existing navigation buttons.
    container.querySelector(".navigation-buttons")?.remove();
    const navDiv = document.createElement("div");
    navDiv.className = "navigation-buttons";
    navDiv.style.cssText = "margin-top: 20px; text-align: center;";
    const prevBtn = document.createElement("button");
    prevBtn.textContent = "← Eelmine küsimus";
    prevBtn.disabled = currentIndex === 0;
    prevBtn.onclick = () => {
      if (currentIndex > 0) {
        displayAnswer(answers[currentIndex - 1], teamId, testName, currentIndex, answers.length);
        createNavigationButtons(answers, currentIndex - 1, teamId, testName);
      }
    };
    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Järgmine küsimus →";
    nextBtn.disabled = currentIndex === answers.length - 1;
    nextBtn.onclick = () => {
      if (currentIndex < answers.length - 1) {
        displayAnswer(answers[currentIndex + 1], teamId, testName, currentIndex + 2, answers.length);
        createNavigationButtons(answers, currentIndex + 1, teamId, testName);
      }
    };
    const counter = document.createElement("span");
    counter.textContent = ` Küsimus ${currentIndex + 1} / ${answers.length} `;
    counter.style.margin = "0 15px";
    counter.style.fontWeight = "bold";
    navDiv.appendChild(prevBtn);
    navDiv.appendChild(counter);
    navDiv.appendChild(nextBtn);
    container.appendChild(navDiv);
  }

  const { teamId, questionId, attemptId } = getParams();
  console.log("Params:", { teamId, questionId, attemptId });
  if (!teamId) {
    document.querySelector(".answer-container").innerHTML = "<p>URL-is puudub tiimi ID.</p>";
    return;
  }
  if (questionId) {
    loadSingleAnswer(teamId, questionId);
  } else {
    loadAllTeamAnswers(teamId, attemptId);
  }
});
