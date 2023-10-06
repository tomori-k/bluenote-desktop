# bluenote-desktop

## 環境構築

1. Rust と Node.js を導入しておく
1. 以下のコマンドを実行
   ```
   npm i
   npx prisma migrate dev
   cd bluenote-bluetooth
   npm i
   ```

### IDE

- [VS Code](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).
- VS Code ビルトインの TypeScript Language Server をオフにする

### 起動

VS Code の実行とデバッグタブから `Debug` の構成を選択し、実行ボタンをクリック

もしくは、

```
npm run debug
```
