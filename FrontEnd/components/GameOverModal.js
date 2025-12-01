import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { connect } from "../reducers/user";

import styles from "../styles/GameOverModal.module.css";

export default function GameOverModal({ score, onRestart }) {
  const dispatch = useDispatch();

  const { username, password } = useSelector(state => state.user);
  const bestScore = useSelector(state => state.user.bestScore);

  const [bestScoreUser, setBestScoreUser] = useState(0);
  const [showFirework, setShowFirework] = useState(false);

  const [top3Scores, setTop3Scores] = useState([]);

  function playFireworkAnimation() {
    setShowFirework(true);
    setTimeout(() => setShowFirework(false), 2000);
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === "Space") {
        onRestart();
      }
    };

    fetch("http://localhost:3000/top3")
      .then(res => res.json())
      .then(data => {
        setTop3Scores(data.top3)
        console.log("la get" + data)
      }
    );

    fetch(`http://localhost:3000/users/bestScoreUser?username=${username}`)
      .then(res => res.json())
      .then(data => {
        if (data.result) {
          setBestScoreUser(data.bestScoreUser);
          if (score > data.bestScoreUser) {
            playFireworkAnimation();
            setBestScoreUser(score);

            fetch("http://localhost:3000/users/bestScoreUser", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ username, score }),
            })
              .then(res => res.json())
              .then(data => {
                dispatch(connect({
                  username,
                  bestScore: score,
                  token: data.token,
                  connected: true,
                }));
                console.log("la patchUser" + data)
              });

            fetch("http://localhost:3000/top3", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ username, score }),
            })
              .then(res => res.json())
              .then(data => {
                if (data.result) setTop3Scores(data.top3);
                console.log("la patch" + data.top3)
              });
          }
        }
      });

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onRestart]);

  return (
    <div data-component="GameOverModalBackdrop" className={styles.overlay}>
      <div data-component="GameOverModalContent" className={styles.modal}>

        {/* ===== FIREWORK ANIMATION ===== */}
        {showFirework && (
          <img
            data-component="GameOverFireworkAnimation"
            src="/Anim/clicportfolio.gif"
            className={styles.firework}
            alt="Firework animation"
          />
        )}

        {/* ===== GAME OVER TITLE ===== */}
        <img
          data-component="GameOverTitleIcon"
          className={styles.gameOverSvg}
          src="/ChairRunGame/gameover.svg"
          alt="Game Over"
        />

        {/* ===== FINAL SCORE SECTION ===== */}
        <div data-component="FinalScoreSection" className={styles.scoreDiv}>
          <img
            data-component="FinalScoreLabelIcon"
            className={styles.scoreSvg}
            src="/ChairRunGame/yourscore.svg"
            alt="Your Score"
          />
          <div data-component="FinalScoreValue" className={styles.scoreTxt}>
            {score}
          </div>
        </div>

        {/* ===== BEST SCORE SECTION ===== */}
        <div data-component="BestScoreSection" className={styles.bestScoreDiv}>
          <img
            data-component="BestScoreLabelIcon"
            className={styles.bestScoreSvg}
            src="/ChairRunGame/yourbestscore.svg"
            alt="Your Best Score"
          />
          <div data-component="BestScoreValue" className={styles.bestScoreTxt}>
            {bestScoreUser}
          </div>
        </div>

        {/* ===== LEADERBOARD SECTION ===== */}
        <div data-component="LeaderboardSection">
          <div>
            <img
              data-component="LeaderboardLabelIcon"
              className={styles.top3Svg}
              src="/ChairRunGame/top3.svg"
              alt="Top 3 Scores"
            />
            <div data-component="LeaderboardList" className={styles.usersBestScore}>
              {top3Scores.map((entry, idx) => (
                <p 
                  data-component="LeaderboardEntry"
                  data-rank={idx + 1}
                  key={idx} 
                  className={styles.usersBestScoreTxt}
                >
                  <span data-component="LeaderboardRank">{idx + 1}.</span>
                  <span data-component="LeaderboardUsername">{entry.username}</span>
                  <span data-component="LeaderboardScore">: {entry.score}</span>
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* ===== RESTART INSTRUCTIONS ===== */}
        <h6 data-component="RestartInstructions" className={styles.pressStart}>
          Press Start to restart
        </h6>
      </div>
    </div>
  );
}