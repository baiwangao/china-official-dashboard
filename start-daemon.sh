#!/bin/bash
# 进程守护脚本：服务挂了自动重启
cd /Users/gaozhen/Documents/Playground/china-official-dashboard

while true; do
  echo "$(date) - 启动服务..."
  NODE_OPTIONS=--dns-result-order=ipv4first node server.js
  echo "$(date) - 服务退出，5秒后重启..."
  sleep 5
done
