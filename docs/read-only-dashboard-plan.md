# Read-only dashboard plan

Webappen skal være et overbliksdashboard for projektet Arbejde.

## Grundregel

Brugeren skal ikke skrive arbejdsvist indhold i webappen.

Flowet er:

1. Brugeren taler/skriver med ChatGPT i projektet Arbejde.
2. ChatGPT strukturerer opgaver, notater, aftaler og overblik.
3. ChatGPT gemmer relevante data i Google Sheet `ChatGPT Arbejde-hukommelse`.
4. Webappen henter data fra Google Sheet via et API-endpoint.
5. Webappen viser overblik og kladder.
6. Brugeren kan kun udføre status-handlinger, fx kopiere et Sensum-notat eller markere det som ført.

## Webappen må gerne

- vise aktive Sensum-kladder
- vise aktive opgaver
- vise ventepunkter
- vise møder/aftaler
- vise rutiner
- vise næste handling
- vise links til Google Sheet og projektkilder
- synkronisere fra et endpoint
- markere et notat som ført i Sensum

## Webappen skal ikke

- indeholde fri tekstinput til arbejdsnoter
- have screenshot-import som almindelig arbejdsflow
- have dokumentimport som almindelig arbejdsflow
- fungere som lokal hukommelse, der konkurrerer med Google Sheet
- kræve copy/paste fra ChatGPT for at skabe kladder

## Datakilde

Google Sheet er fælles lager og sandhedskilde.

Repoet må kun indeholde kode, skabeloner og ufølsomme projektregler. Konkrete noter om børn/unge må ikke ligge i GitHub.
