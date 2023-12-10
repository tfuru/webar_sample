# webar_sample


# Github Pages Deploy

## Actions permissions の設定
1. Settings タブを開いて、左ペインの Actions > General を選択
2. Workflow permissions のところで、read and write permissions を選択

## Github Pages workflows の設定
```
# Github Page へデプロイする
name: GitHub Pages Deploy

on:
    push:
      branches: [ "main" ]
    pull_request:
      branches: [ "main" ]

jobs:
    build:
        runs-on: ubuntu-latest  
        steps:
            - uses: actions/checkout@v3
            - name: Setup Node.js environment
              uses: actions/setup-node@v3
              with:
                  node-version: 16.x
            - name: Install dependencies
              run: npm install
              working-directory: ./webapp
            - name: Build
              run: npm run build
              working-directory: ./webapp
            - name: Deploy
              uses: peaceiris/actions-gh-pages@v3
              with:
                  github_token: ${{ secrets.GITHUB_TOKEN }}
                  publish_dir: ./webapp/dist
```


# 設置先

https://tfuru.github.io/webar_sample/