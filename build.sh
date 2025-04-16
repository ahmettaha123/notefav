#!/bin/bash

# Önce bağımlılıkları yüklüyoruz
npm install

# Eksik paketleri manuel olarak ekliyoruz
npm install react-hot-toast@2.4.1

# Build işlemini gerçekleştiriyoruz
npm run build 