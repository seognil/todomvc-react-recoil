// @ts-check

const { readFileSync } = require("fs");
const { join } = require("path");

/** @type import('../../packages/data/src').ProjectMetaRaw */
const meta = {
  title: "Jotai instead of Recoil",
  desc: "Jotai is a Recoil alternative with minimalistic API",

  stacks: ["vite", "react-hooks", "jotai", "ts", "sass"],

  core: ["jotai"],

  usage: {
    lang: "tsx",
    code: ["atom()", "useAtom()"],
    note: [
      "Jotai's design principles are similar to Recoil's: using simple API to achieve high performance by preventing extra re-render. But Jotai is way simpler.",
      "But there are some differences. Jotai doesn't have a concept like `RecoilRoot` as Recoil, all state is globally accessible. And Recoil has more powerful utils such as `atomFamily` and `Snapshots` which Jotai doesn't provide.",
    ],
    snippet: readFileSync(join(__dirname, "./concepts.tsx"), "utf-8"),
  },

  resources: [
    "recoil",
    "jotai",
    {
      title: "Jotai vs. Recoil: What are the differences?",
      url: "https://blog.logrocket.com/jotai-vs-recoil-what-are-the-differences/",
    },
  ],
};

module.exports = meta;