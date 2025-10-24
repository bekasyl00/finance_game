// Simple client-side finance game logic
// Author: ChatGPT (example project)

(() => {
  // config
  const START_CASH = 100;
  const TOTAL_ROUNDS = 6;
  const CREDIT_INTEREST_RATE = 0.08; // 8% per round on outstanding debt

  // state
  let state = {
    cash: 0,
    debt: 0,
    round: 0,
    assets: {
      stocks: 0,
      bonds: 0,
      crypto: 0,
      startup: 0
    },
    logLines: []
  };

  // ui elements
  const $cash = document.getElementById("cash");
  const $debt = document.getElementById("debt");
  const $round = document.getElementById("round");
  const $totalRounds = document.getElementById("total-rounds");
  const $assets = {
    stocks: document.getElementById("stocks"),
    bonds: document.getElementById("bonds"),
    crypto: document.getElementById("crypto"),
    startup: document.getElementById("startup")
  };
  const $log = document.getElementById("log");
  const $startBtn = document.getElementById("start-btn");
  const $nextBtn = document.getElementById("next-btn");
  const $resetBtn = document.getElementById("reset-btn");
  const $endBtn = document.getElementById("end-game-btn");

  document.getElementById("total-rounds-label").innerText = TOTAL_ROUNDS;
  $totalRounds.innerText = TOTAL_ROUNDS;

  function rnd(min, max) {
    return Math.random() * (max - min) + min;
  }

  function format(n) {
    return n.toFixed(2);
  }

  function log(text) {
    const ts = `R${state.round}`;
    const line = `[${ts}] ${text}`;
    state.logLines.unshift(line);
    if (state.logLines.length > 200) state.logLines.pop();
    $log.innerHTML = state.logLines.join("<br>");
  }

  function updateUI() {
    $cash.innerText = format(state.cash);
    $debt.innerText = format(state.debt);
    $round.innerText = state.round;
    $assets.stocks.innerText = format(state.assets.stocks);
    $assets.bonds.innerText = format(state.assets.bonds);
    $assets.crypto.innerText = format(state.assets.crypto);
    $assets.startup.innerText = format(state.assets.startup);
    $log.scrollTop = 0;
  }

  function startGame() {
    state.cash = START_CASH;
    state.debt = 0;
    state.round = 0;
    state.assets = { stocks:0, bonds:0, crypto:0, startup:0 };
    state.logLines = [];
    log("Game started. You have $"+format(state.cash));
    $startBtn.disabled = true;
    $nextBtn.disabled = false;
    $resetBtn.disabled = false;
    $endBtn.disabled = false;
    updateUI();
  }

  function invest(asset, amount) {
    amount = Number(amount);
    if (!amount || amount <= 0) {
      alert("Enter an amount > 0");
      return;
    }
    if (amount > state.cash) {
      alert("Not enough cash");
      return;
    }
    state.cash -= amount;
    state.assets[asset] += amount;
    log(`Invested $${format(amount)} in ${asset}`);
    updateUI();
  }

  // buttons for invest
  document.querySelectorAll(".invest-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const asset = e.currentTarget.dataset.asset;
      const input = document.getElementById(asset + "-input");
      invest(asset, input.value);
      input.value = "";
    });
  });

  // take credit
  document.getElementById("take-credit").addEventListener("click", () => {
    const amt = Number(document.getElementById("credit-amount").value);
    if (!amt || amt <= 0) { alert("Enter amount to borrow"); return; }
    // simple credit limit: can borrow up to 500 total
    if (state.debt + amt > 500) {
      alert("Credit limit reached (max total debt $500)");
      return;
    }
    state.cash += amt;
    state.debt += amt;
    log(`Took credit (долг) $${format(amt)}. Debt now $${format(state.debt)}`);
    document.getElementById("credit-amount").value = "";
    updateUI();
  });

  // repay
  document.getElementById("repay-btn").addEventListener("click", () => {
    const amt = Number(document.getElementById("repay-amount").value);
    if (!amt || amt <= 0) { alert("Enter amount to repay"); return; }
    if (amt > state.cash) { alert("Not enough cash to repay that amount"); return; }
    const repay = Math.min(amt, state.debt);
    state.cash -= repay;
    state.debt -= repay;
    log(`Repaid $${format(repay)} of debt. Remaining debt $${format(state.debt)}`);
    document.getElementById("repay-amount").value = "";
    updateUI();
  });

  // next turn: compute returns and interest
  function nextTurn() {
    if (state.round >= TOTAL_ROUNDS) {
      alert("No more turns. Click End Game & Evaluate.");
      return;
    }
    state.round += 1;
    log("=== TURN " + state.round + " ===");

    // Apply returns to each asset (percentage based)
    // Stocks: random between -40% and +60%
    const stocksReturn = rnd(-0.40, 0.60);
    const stocksGain = state.assets.stocks * stocksReturn;
    state.assets.stocks += stocksGain;
    log(`Stocks: ${stocksReturn>=0?"+":""}${(stocksReturn*100).toFixed(1)}% -> ${stocksGain>=0?"+":""}$${format(stocksGain)}`);

    // Bonds: +2% .. +6%
    const bondsReturn = rnd(0.02, 0.06);
    const bondsGain = state.assets.bonds * bondsReturn;
    state.assets.bonds += bondsGain;
    log(`Bonds: +${(bondsReturn*100).toFixed(2)}% -> +$${format(bondsGain)}`);

    // Crypto: -80% .. +200%
    const cryptoReturn = rnd(-0.80, 2.00);
    const cryptoGain = state.assets.crypto * cryptoReturn;
    state.assets.crypto += cryptoGain;
    log(`Crypto: ${cryptoReturn>=0?"+":""}${(cryptoReturn*100).toFixed(1)}% -> ${cryptoGain>=0?"+":""}$${format(cryptoGain)}`);

    // Startup: 90% fail (0% return), 10% win (+500%)
    let startupGain = 0;
    if (state.assets.startup > 0) {
      const chance = Math.random();
      if (chance < 0.10) {
        startupGain = state.assets.startup * 5.0; // +500%
        state.assets.startup += startupGain;
        log(`Startup: BIG WIN! +500% -> +$${format(startupGain)}`);
      } else {
        // fail: lose the invested startup amount
        startupGain = -state.assets.startup;
        state.assets.startup = 0;
        log(`Startup: failed -> -$${format(-startupGain)}`);
      }
    } else {
      log("Startup: no investment");
    }

    // Interest on debt
    if (state.debt > 0) {
      const interest = state.debt * CREDIT_INTEREST_RATE;
      state.debt += interest;
      log(`Interest charged: $${format(interest)} (8%) -> Debt $${format(state.debt)}`);
    } else {
      log("No debt -> no interest this turn");
    }

    // Small passive income: if you have lots of cash (>200), you earn bank interest 1%
    if (state.cash > 200) {
      const passive = state.cash * 0.01;
      state.cash += passive;
      log(`Bank interest on cash: +$${format(passive)}`);
    }

    updateUI();

    if (state.round >= TOTAL_ROUNDS) {
      $nextBtn.disabled = true;
      log("Reached final round. Click End Game & Evaluate.");
    }
  }

  // end game evaluation
  function endGame() {
    // compute net worth
    const assetSum = state.assets.stocks + state.assets.bonds + state.assets.crypto + state.assets.startup;
    const netWorth = state.cash + assetSum - state.debt;
    const resultDiv = document.getElementById("result");
    const message = `Final net worth: $${format(netWorth)} (cash $${format(state.cash)} + assets $${format(assetSum)} - debt $${format(state.debt)})`;
    resultDiv.innerText = message;

    if (netWorth >= 1000) {
      resultDiv.className = "text-success";
      log("RESULT: You became rich! 🎉 " + message);
    } else if (netWorth >= 200) {
      resultDiv.className = "text-primary";
      log("RESULT: Comfortable. Good job! " + message);
    } else if (netWorth >= 0) {
      resultDiv.className = "text-warning";
      log("RESULT: Broke but afloat. " + message);
    } else {
      resultDiv.className = "text-danger";
      log("RESULT: Big trouble — you are in heavy долг (debt)! " + message);
    }

    // disable further actions
    $startBtn.disabled = false;
    $nextBtn.disabled = true;
    $endBtn.disabled = true;
  }

  // attach buttons
  $startBtn.addEventListener("click", startGame);
  $nextBtn.addEventListener("click", nextTurn);
  $resetBtn.addEventListener("click", () => {
    if (confirm("Reset game?")) {
      state = { cash:0, debt:0, round:0, assets:{stocks:0,bonds:0,crypto:0,startup:0}, logLines:[] };
      document.getElementById("result").innerText = "";
      updateUI();
      $startBtn.disabled = false;
      $nextBtn.disabled = true;
      $resetBtn.disabled = true;
      $endBtn.disabled = true;
      $log.innerHTML = "";
    }
  });
  $endBtn.addEventListener("click", endGame);

  // initialize UI
  updateUI();
})();
