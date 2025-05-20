#!/bin/bash
sed -i '14s/rounded-xl/border border-slate-200 dark:border-slate-600 rounded-xl/' client/src/components/RecentActivity.tsx
sed -i '45s/rounded-xl/border border-slate-200 dark:border-slate-600 rounded-xl/' client/src/components/RecentActivity.tsx
chmod +x temp_fix.sh
./temp_fix.sh
