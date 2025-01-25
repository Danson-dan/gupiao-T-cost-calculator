# 股票做T成本计算器

股票做T计算器，输入持仓数量、持仓成本、买入股数、买入价格、卖出股数、卖出价格,可以自动计算出做T后的持仓成本价、做T操作的盈亏、以及总交易费用，并提供历史计算记录查询

# 技术栈

前端：Vue.js（使用 Vue 3 + Composition API）。

后端：Node.js + Express。

数据库：SQLite。

构建工具：Vite（用于快速构建 Vue 项目）。



# 初始化后端（Node.js + Express）：
```sh
cd ..
mkdir backend
cd backend
npm init -y
npm install express sqlite3 cors
```

# 初始化前端（Vue 3 + Vite）：
```sh
npm create vite@latest projectname --template vue
cd projectname
npm install
```

# 前端
## gupiao-t-cost-calculator

This template should help get you started developing with Vue 3 in Vite.


### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
