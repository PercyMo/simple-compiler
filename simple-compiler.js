'use strict';

/**
 * 我们要把 lisp 风格的函数调用编译成 C 风格。
 * 假如我们有两个函数 `add` 和 `subtract`，使用方法如下：
 *
 *                  LISP                      C
 *
 *   2 + 2          (add 2 2)                 add(2, 2)
 *   4 - 2          (subtract 4 2)            subtract(4, 2)
 *   2 + (4 - 2)    (add 2 (subtract 4 2))    add(2, subtract(4, 2))
 *
 * 虽然这不是 LISP 或者 C 的完整语法，但足以演示主流编译器工作流程
 */

/**
 * 大部分编译器可以拆分成三个主要阶段：解析、转换和代码生成
 *
 * 1. 解析：将源代码转化为抽象语法树
 * 2. 转换：对抽象语法树进行操作
 * 3. 代码生成：将转换后的抽象语法树生成新代码
 */

/**
 * 解析
 * -------
 *
 * 解析通常分为两个阶段：词法分析和句法分析
 *
 * 1. 词法分析：通过分词器将原代码拆分为 tokens，tokens 是描述语法的最小单位，可以是数字、标签、标点、运算符...
 *
 * 2. 句法分析：将 tokens 重新格式化为可以表述彼此关系的结构 - 抽象语法树
 *    AST 是一种深度嵌套的对象，易于使用且可以告诉我们更多信息
 *    
 *
 * 举个例子: (add 2 (subtract 4 2))
 *
 * 解析为 Tokens 如下:
 *
 *   [
 *     { type: 'paren',  value: '('        },
 *     { type: 'name',   value: 'add'      },
 *     { type: 'number', value: '2'        },
 *     { type: 'paren',  value: '('        },
 *     { type: 'name',   value: 'subtract' },
 *     { type: 'number', value: '4'        },
 *     { type: 'number', value: '2'        },
 *     { type: 'paren',  value: ')'        },
 *     { type: 'paren',  value: ')'        },
 *   ]
 *
 * AST结构如下:
 *
 *   {
 *     type: 'Program',
 *     body: [{
 *       type: 'CallExpression',
 *       name: 'add',
 *       params: [{
 *         type: 'NumberLiteral',
 *         value: '2',
 *       }, {
 *         type: 'CallExpression',
 *         name: 'subtract',
 *         params: [{
 *           type: 'NumberLiteral',
 *           value: '4',
 *         }, {
 *           type: 'NumberLiteral',
 *           value: '2',
 *         }]
 *       }]
 *     }]
 *   }
 */

/**
 * 转换
 * -------
 * 对 AST 进行更改，可以在同种语言下进行操作，也可以转化为完全不同的新语言
 *
 * 我们可以通过添加/删除/替换属性来操作节点，也可以添加/删除节点，也可以在现有 AST 基础上创建全新的 AST
 * 如果我们的目标是一门新语言，我们可以专注于创建特定于目标语言的全新 AST
 *
 * 遍历
 * ---------
 * 
 *   {
 *     type: 'Program',
 *     body: [{
 *       type: 'CallExpression',
 *       name: 'add',
 *       params: [{
 *         type: 'NumberLiteral',
 *         value: '2'
 *       }, {
 *         type: 'CallExpression',
 *         name: 'subtract',
 *         params: [{
 *           type: 'NumberLiteral',
 *           value: '4'
 *         }, {
 *           type: 'NumberLiteral',
 *           value: '2'
 *         }]
 *       }]
 *     }]
 *   }
 * 
 * 深度优先遍历：
 *   1. Program - 从 AST 顶层开始
 *   2. CallExpression (add) - 移动到 Program[body] 的第一个元素
 *   3. NumberLiteral (2) - 移动到 CallExpression[params] 的第一个元素
 *   4. CallExpression (subtract) - 移动到 CallExpression[params] 的第二个元素
 *   5. NumberLiteral (4) - 移动到 CallExpression[params] 的第一个元素
 *   6. NumberLiteral (2) - 移动到 CallExpression[params] 的第二个元素
 *
 * 访问者模式
 * --------
 *
 * 最基本的想法是可以创建一个 visitor 对象，他有接受不同类型节点的方法
 *
 *   var visitor = {
 *     NumberLiteral() {},
 *     CallExpression() {},
 *   };
 *
 * 遍历 AST 时，当 enter 到匹配的类型节点，就会调用 visitor 上的方法，同时将节点本身和父节点传入
 *
 *   var visitor = {
 *     NumberLiteral(node, parent) {},
 *     CallExpression(node, parent) {},
 *   };
 *
 * 但是也存在节点 exit 时要调用东西的可能性
 *
 *   - Program
 *     - CallExpression
 *       - NumberLiteral
 *       - CallExpression
 *         - NumberLiteral
 *         - NumberLiteral
 *
 * 向下遍历，enter 每一个节点，当遍历到分支末端时 exit 节点
 *
 *   -> Program (enter)
 *     -> CallExpression (enter)
 *       -> Number Literal (enter)
 *       <- Number Literal (exit)
 *       -> Call Expression (enter)
 *          -> Number Literal (enter)
 *          <- Number Literal (exit)
 *          -> Number Literal (enter)
 *          <- Number Literal (exit)
 *       <- CallExpression (exit)
 *     <- CallExpression (exit)
 *   <- Program (exit)
 *
 * 为了支持这一点，visitor 最终形式如下：
 *
 *   var visitor = {
 *     NumberLiteral: {
 *       enter(node, parent) {},
 *       exit(node, parent) {},
 *     }
 *   };
 */

/**
 * 代码生成
 * ---------------
 *
 * 代码生成器有几种不同的方式，有些会重用之前的 tokens，但大多数会使用创建的 AST
 * 代码生成器需要知道如何打印不同的节点类型，并且会递归调用自己去打印嵌套节点，直至所有节点都被打印成字符串
 */

/**
 * 分词器
 *
 * 将代码字符串分解成一个数组
 * 
 *   (add 2 (subtract 4 2))   =>   [{ type: 'paren', value: '(' }, ...]
 */
function tokenizer(input) {
  
  // 记录当前代码位置
  let current = 0;
  // token 数组
  const tokens = [];

  // 使用 while 循环，在一次循环中可能多次修改 current，因为 token 可以为任意长度
  while (current < input.length) {

    // 当前字符
    let char = input[current];

    // 检查左括号
    if (char === '(') {

      // push 新标记值到数组
      tokens.push({
        type: 'paren',
        value: '(',
      });

      current++;

      // 继续下一个循环
      continue;
    }

    if (char === ')') {
      tokens.push({
        type: 'paren',
        value: ')',
      });
      current++;
      continue;
    }

    // 跳过空格继续
    const WHITESPACE = /\s/;
    if (WHITESPACE.test(char)) {
      current++;
      continue;
    }

    // 数字可能为任意长度的字符，将完整连续字符作为一个标记
    //
    //   (add 123 456)
    //        ^^^ ^^^
    //        只有两个单独的 token
    const NUMBERS = /[0-9]/;
    if (NUMBERS.test(char)) {
      let value = '';

      // 遍历字符，直到遇到不是数字的一个字符
      while (NUMBERS.test(char)) {
        value += char;
        char = input[++current];
      }

      // 将完整拼接的数字 token 推进数组
      tokens.push({ type: 'number', value });

      continue;
    }

    // 处理双引号引用的字符串
    //
    //   (concat "foo" "bar")
    //            ^^^   ^^^ string tokens
    if (char === '"') {
      let value = '';

      // 跳过开头的引号
      char = input[++current];

      // 遍历字符直到遇到另外一个引号
      while (char !== '"') {
        value += char;
        char = input[++current];
      }

      // 跳过结束的引号
      char = input[++current];

      tokens.push({ type: 'string', value });

      continue;
    }

    // 处理函数名
    //
    //   (add 2 4)
    //    ^^^
    //    Name token
    //
    const LETTERS = /[a-z]/;
    if (LETTERS.test(char)) {
      let value = '';

      // 遍历字符将完整的单词作为 token
      while (LETTERS.test(char)) {
        value += char;
        char = input[++current];
      }

      tokens.push({ type: 'name', value });

      continue;
    }

    throw new TypeError('I dont konw what this character is: ' + char);
  }

  return tokens;
}

/**
 * 解析器
 *
 * 将 tokens 数组转换为 AST
 *
 *   [{ type: 'paren', value: '(' }, ...]   =>   { type: 'Program', body: [...] }
 */
function parser(tokens) {
  let current = 0;

  // 使用递归而不是 while 循环
  function walk() {

    let token = tokens[current];

    // 返回新的 NumberLiteral 节点
    if (token.type === 'number') {

      current++;

      return {
        type: 'NumberLiteral',
        value: token.value,
      };
    }

    // 返回新的 StringLiteral 节点
    if (token.type === 'string') {
      current++;

      return {
        type: 'StringLiteral',
        value: token.value,
      };
    }

    // 接下来查找 CallExpressions
    if (
      token.type === 'paren' &&
      token.value === '('
    ) {

      // 跳过左括号
      token = tokens[++current];

      // 创建 CallExpression 节点的基本结构，并设置函数名
      const node = {
        type: 'CallExpression',
        name: token.value,
        params: [],
      };

      // 跳过函数名 token
      token = tokens[++current];

      // 继续递归遍历 tokens，直到遇到右括号，中间部分作为 params
      //
      // 下面的例子中存在嵌套的调用表达式
      //
      //   (add 2 (subtract 4 2))
      //
      // 对应生成的 tokens 中也存在两个右括号
      //
      //   [
      //     { type: 'paren',  value: '('        },
      //     { type: 'name',   value: 'add'      },
      //     { type: 'number', value: '2'        },
      //     { type: 'paren',  value: '('        },
      //     { type: 'name',   value: 'subtract' },
      //     { type: 'number', value: '4'        },
      //     { type: 'number', value: '2'        },
      //     { type: 'paren',  value: ')'        }, <<< Closing parenthesis
      //     { type: 'paren',  value: ')'        }, <<< Closing parenthesis
      //   ]
      //
      // walk 函数会增加 current 的值
      while (
        (token.type !== 'paren') ||
        (token.type === 'paren' && token.value !== ')')
      ) {
        // 将 walk 函数返回的 node 节点推入 node.params
        node.params.push(walk());
        token = tokens[current];
      }

      // 跳过右括号
      token = tokens[++current];

      return node;
    }

    throw new TypeError(token.type);
  }

  // 创建根节点为 Program 的 ast
  const ast = {
    type: 'Program',
    body: [],
  };

  // 调用 walk 函数，将节点推入 ast.body
  // 之所以要循环，因为可能存在多个调用表达式并列的情况
  //
  //   (add 2 2)
  //   (subtract 4 2)
  //
  while (current < tokens.length) {
    ast.body.push(walk());
  }

  return ast;
}

/**
 * 遍历器
 * 
 * 设计一种访问者模式，遍历 ast 上的所有节点
 * 当匹配到对应类型的节点时，调用对应方法
 *
 *   traverse(ast, {
 *     Program: {
 *       enter(node, parent) {
 *         // ...
 *       },
 *       exit(node, parent) {
 *         // ...
 *       },
 *     },
 *
 *     CallExpression: {
 *       enter(node, parent) {
 *         // ...
 *       },
 *       exit(node, parent) {
 *         // ...
 *       },
 *     },
 *
 *     NumberLiteral: {
 *       enter(node, parent) {
 *         // ...
 *       },
 *       exit(node, parent) {
 *         // ...
 *       },
 *     },
 *   });
 */

// traverser 函数接收 ast 和 一个访问者对象
function traverser(ast, visitor) {

  // 遍历数组并调用 traverseNode
  function traverseArray(array, parent) {
    array.forEach(child => {
      traverseNode(child, parent);
    });
  }

  // traverseNode 接收两个参数，当前节点和父节点
  function traverseNode(node, parent) {

    // 取到当前节点上的方法
    const methods = visitor[node.type];

    // 若节点上存在 enter 方法，则触发 enter，并传入 node 和 parent
    if (methods && methods.enter) {
      methods.enter(node, parent);
    }

    switch (node.type) {

      // 从顶层的 Program 开始遍历，使用 traverseArray 继续向下遍历 Program[body]
      case 'Program':
        traverseArray(node.body, node);
        break;

      // 同样，继续遍历 CallExpression 的 params
      case 'CallExpression':
        traverseArray(node.params, node);
        break;

      //  NumberLiteral 和 StringLiteral 没有子节点，不做任何处理
      case 'NumberLiteral':
      case 'StringLiteral':
        break;

      default:
        throw new TypeError(node.type);
    }

    // 若节点上存在 exit 方法，则触发 exit，并传入 node 和 parent
    if (methods && methods.exit) {
      methods.exit(node, parent);
    }
  }

  // 传入整个 ast 调用 traverseNode 函数
  traverseNode(ast, null);
}

/**
 * 转换器
 *
 * 将 ast 传给遍历器函数，并创建新的 ast
 *
 * ----------------------------------------------------------------------------
 *    原 AST                          |    转换后 AST
 * ----------------------------------------------------------------------------
 *   {                                |   {
 *     type: 'Program',               |     type: 'Program',
 *     body: [{                       |     body: [{
 *       type: 'CallExpression',      |       type: 'ExpressionStatement',
 *       name: 'add',                 |       expression: {
 *       params: [{                   |         type: 'CallExpression',
 *         type: 'NumberLiteral',     |         callee: {
 *         value: '2'                 |           type: 'Identifier',
 *       }, {                         |           name: 'add'
 *         type: 'CallExpression',    |         },
 *         name: 'subtract',          |         arguments: [{
 *         params: [{                 |           type: 'NumberLiteral',
 *           type: 'NumberLiteral',   |           value: '2'
 *           value: '4'               |         }, {
 *         }, {                       |           type: 'CallExpression',
 *           type: 'NumberLiteral',   |           callee: {
 *           value: '2'               |             type: 'Identifier',
 *         }]                         |             name: 'subtract'
 *       }]                           |           },
 *     }]                             |           arguments: [{
 *   }                                |             type: 'NumberLiteral',
 *                                    |             value: '4'
 *                                    |           }, {
 *                                    |             type: 'NumberLiteral',
 *                                    |             value: '2'
 *                                    |           }]
 *                                    |         }
 *                                    |       }
 *                                    |     }]
 *                                    |   }
 * ----------------------------------------------------------------------------
 */

// transformer 函数接受 lisp ast.
function transformer(ast) {

  // 创建全新的 ast
  const newAst = {
    type: 'Program',
    body: [],
  };

  // 根节点的 _context 是引用自 newAst
  ast._context = newAst.body;

  // 访问者模式遍历 ast
  traverser(ast, {

    // 匹配对应节点类型时触发钩子函数
    NumberLiteral: {
      // 进入节点时立即触发
      enter(node, parent) {
        parent._context.push({
          type: 'NumberLiteral',
          value: node.value,
        });
      },
    },

    StringLiteral: {
      enter(node, parent) {
        parent._context.push({
          type: 'StringLiteral',
          value: node.value,
        });
      },
    },

    CallExpression: {
      enter(node, parent) {
        
        // 创建 CallExpression 节点
        let expression = {
          type: 'CallExpression',
          callee: {
            type: 'Identifier',
            name: node.name,
          },
          arguments: [],
        };

        // 原 CallExpression 节点上新增一个 _context，引用新节点的 arguments
        node._context = expression.arguments;

        // 检查父节点类型是否为 CallExpression
        if (parent.type !== 'CallExpression') {

          // 在 CallExpression 外层包裹一个 ExpressionStatement，
          // 因为顶级的 CallExpression 在js中是一条语句
          expression = {
            type: 'ExpressionStatement',
            expression,
          };
        }

        // 将新的 CallExpression 节点 push 到父节点的 _context
        parent._context.push(expression);
      },
    },
  });
  
  return newAst;
}

/**
 * 代码生成器
 * 
 * 代码生成器会递归调用自己去打印 ast 上的所有节点，直至所有节点都被打印成字符串
 */

function codeGenerator(node) {

  switch (node.type) {

    // 遍历 body 下的节点，并用换行符拼接它们
    case 'Program':
      return node.body.map(codeGenerator)
        .join('\n');

    // 继续调用 ExpressionStatement[expression] 并在结尾添加分号
    case 'ExpressionStatement':
      return (
        codeGenerator(node.expression) +
        ';'
      );

    // 拼接一个 CallExpression 
    // 函数名(参数, 参数)
    case 'CallExpression':
      return (
        codeGenerator(node.callee) +
        '(' +
        node.arguments.map(codeGenerator)
          .join(', ') +
        ')'
      );

    case 'Identifier':
      return node.name;

    case 'NumberLiteral':
      return node.value;

    // 在 StringLiteral 值前后添加引号
    case 'StringLiteral':
      return `"${node.value}"`;

    default:
      throw new TypeError(node.type);
  }
}

/**
 * 编译器
 * 
 *   1. input  => tokenizer   => tokens
 *   2. tokens => parser      => ast
 *   3. ast    => transformer => newAst
 *   4. newAst => generator   => output
 */

function compiler (input) {
  const tokens = tokenizer(input);
  const ast = parser(tokens);
  const newAst = transformer(ast);
  const output = codeGenerator(newAst);

  return output;
}

export {
  tokenizer,
  parser,
  traverser,
  transformer,
  codeGenerator,
  compiler,
};
