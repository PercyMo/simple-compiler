# 一个极简编译器

**原项目地址：**  [the-super-tiny-compiler](https://github.com/jamiebuilds/the-super-tiny-compiler)  

跟着原项目写了一遍，收获颇丰！ 
原项目中的注释真的是非常详细了，自己的代码中只注释了个人觉得比较有必要的部分。

## 使用
将 `lisp` 风格的函数调用编译成 `C` 风格。
```js
import { compiler } from './simple-compiler.js';

const input  = '(add 2 (subtract 4 2))';

console.log(compiler(input));
// add(2, subtract(4, 2));
```
