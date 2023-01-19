import "./styles/index.scss";

import Main from "./entries/Main";

(async () => {
  const main = new Main();
  main._load();
})();
