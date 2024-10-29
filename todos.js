const readline = require("readline");
const fs = require("fs");
const TODOSFILE = "./tt.txt";
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const alreadyTodos = fs.existsSync(TODOSFILE);
const TOTALMENU = {
  MAIN: {
    0: "--MAIN--",
    1: { router: "CREATE", content: "1. todo 작성하기" },
    2: { router: "TODO", content: "2. todo 목록보기" },
    3: { router: "EXIT", content: "3. 종료하기" },
  },
  TODO: {
    0: "--TODO--",
    1: { router: "CREATE", content: "1. todo 작성하기" },
    2: { router: "MODIFY", content: "2. todo 수정하기" },
    3: { router: "CHECK", content: "3. todo 체크하기" },
    4: { router: "DELETE", content: "4. todo 삭제하기" },
    5: { router: "MAIN", content: "5. 이전메뉴" },
    6: { router: "EXIT", content: "6. 종료하기" },
  },
  SET: {
    0: "진행하시겠습니까?",
    1: { router: "SET", content: "1. 완료" },
    2: { router: "CANCEL", content: "2. 취소" },
  },
  CHECK: {
    0: "--CHECK_CHANGE--",
    1: "상태를 바꿀 TODO를 선택해주세요.\n(숫자입력)",
    2: "TODO선택하기(취소 입력시 취소) : ",
  },
  CHANGE: {
    0: "--CHANGE_STATE--",
    1: "1. 완료상태(DO)",
    2: "2. 미완료상태(YET)",
    3: "3. 취소하기",
  },
};

let TODOS = [];

const readFile = () => {
  const originTodos = fs.readFileSync(TODOSFILE).toString();
  if (originTodos.length !== 0) TODOS.push(...JSON.parse(originTodos));
};

const printMenu = (menu) => {
  console.log("\n");
  for (const line of Object.values(menu))
    line.content ? console.log(line.content) : console.log(line);
};

const saveFile = () => {
  fs.writeFileSync("./tt.txt", JSON.stringify(TODOS));
};

const exit = () => rl.close();

const menuMove = (content) => {
  printMenu(content);
  console.log("\n무엇을 하시겠습니까?\n(번호로 입력해주세요)");
  rl.once("line", (answer) => {
    if (answer in content && answer !== 0) {
      menuHub(content[answer].router);
    } else {
      console.log("주어진 메뉴 안에서 선택해주세요!");
      menuMove(content);
    }
  });
};

const menuHub = (menu) => {
  switch (menu) {
    case "TODO":
      todoList();
      break;
    case "CREATE":
      createTodo(menu);
      break;
    case "MODIFY":
    case "DELETE":
    case "CHECK":
      findTarget(menu);
      break;
    case "EXIT":
      exit();
      break;
    default:
      menuMove(TOTALMENU[menu]);
  }
};

const todoList = () => {
  console.log("\n----------\n");
  for (const todo of TODOS) {
    console.log("no. ", todo.no);
    console.log(`제목 : ${todo.title}`);
    console.log(`내용 : ${todo.content}`);
    console.log(`상태 : ${todo.state}`);
    console.log(todo.createAt);
    console.log("\n");
  }
  console.log("----------");
  menuMove(TOTALMENU.TODO);
};

const createTodo = (() => {
  let todo = {
    state: "YET",
  };

  return (menu, target) => {
    console.log("\n");
    console.log(
      "title" in todo ? "할일을 적어주세요! :" : "title을 입력해주세요! :"
    );
    rl.once("line", (answer) => {
      if ("title" in todo) {
        todo.content = answer;
        if (target) todo = { ...target, ...todo };
        todoHub(todo);
        todo = {
          state: "YET",
        };
      } else {
        todo.title = answer;
        createTodo(menu, target);
      }
    });
  };
})();

const findTarget = (menu) => {
  printMenu(TOTALMENU.CHECK);

  rl.once("line", (answer) => {
    if (answer.trim() === "취소") {
      menuMove(TOTALMENU.TODO);
      return;
    }
    const todo = TODOS.find((todo) => todo.no.includes(answer));

    if (todo) {
      console.log(`no. ${todo.no}`);
      console.log(`${todo.title}를 선택하셨습니다`);
      todoHub(todo, menu);
    } else {
      console.log("존재하지 않는 TODO입니다.");
      findTarget(menu);
    }
  });
};

const doStateChange = (target) => {
  printMenu(TOTALMENU.CHANGE);
  rl.once("line", (answer) => {
    switch (answer) {
      case "1":
        setTodo({ ...target, state: "DO" });
        break;
      case "2":
        setTodo({ ...target, state: "YET" });
        break;
      case "3":
        menuHub("TODO");
        break;
    }
  });
};

const todoHub = (target, menu) => {
  switch (menu) {
    case "CHECK":
      doStateChange(target);
      break;
    case "MODIFY":
      createTodo(menu, target);
      break;
    default:
      printMenu(TOTALMENU.SET);
      rl.once("line", (answer) => {
        if (answer === "1")
          menu === "DELETE" ? deleteTodo(target) : setTodo(target);
        else menuHub("TODO");
      });
      break;
  }
};

const setTodo = (target) => {
  const date = new Date();
  const todo = {
    no: String(target.no ?? Math.max(...TODOS.map((todo) => todo.no), 0) + 1),
    ...target,
    createAt: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
  };
  saveTodo(todo);
  menuHub("TODO");
};

const saveTodo = (obj) => {
  if (TODOS.find((todo) => todo.no === obj.no))
    TODOS = TODOS.map((todo) => (todo.no === obj.no ? obj : todo));
  else TODOS.push(obj);
  saveFile();
};

const deleteTodo = (obj) => {
  TODOS = TODOS.filter((todo) => todo.no !== obj.no);
  saveFile();
  menuHub("TODO");
};

if (alreadyTodos) {
  readFile();
}

console.log("todos에 오신것을 환영합니다!");
menuMove(TOTALMENU.MAIN);
