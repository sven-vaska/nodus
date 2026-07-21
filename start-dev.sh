#!/bin/bash
cd /Users/svenvaska/Documents/00_Projects/CRM/nodus
export PATH="/Users/svenvaska/.fnm/node-versions/v24.16.0/installation/bin:$PATH"
exec node node_modules/vite/bin/vite.js "$@"
