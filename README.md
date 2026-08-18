# OpenInvest

Public Interactive Brokers portfolio snapshot. Updated after the US cash close. Not investment advice, not an IBKR product.

## Local setup

1. Token is already in `.env.local` (gitignored).
2. In Client Portal: **Performance & Reports → Flex Queries**. Create an **Activity Flex Query** (XML) that includes:
   - Net Asset Value / Change in NAV
   - Open Positions
   - Trades
   - Cash Report / Cash Transactions
   - Allocation (if you want the breakdown)
3. Copy the **Query ID** (a number next to the saved query, not the token) into `.env.local`:

```
IBKR_FLEX_QUERY_ID=123456
```

4. Pull a snapshot:

```
npm install
npm run sync
npm run dev
```

Do not paste the Flex token into chat, git, or the frontend. Rotate it in Client Portal if it was ever shared.
