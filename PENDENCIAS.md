# Pendências (pedidas em 10/11/2026, a fazer quando o Pedro liberar)

1. **Alarme mais forte no fim do descanso**
   - Som mais longo/alto e repetido; voz "Descanso acabou" (se a voz estiver ligada); vibração mais longa; tela piscando.
   - iPhone: usar `navigator.audioSession.type = 'playback'` para o som tocar mesmo com o botão de silencioso ligado.
   - Código: `src/lib/alertas.ts` (`avisar('fim')`) e `Descanso` em `src/screens/TreinoMusculacao.tsx`.

2. **Trocar exercício sem repetir**
   - Na lista de "Trocar", não mostrar exercícios que já estão no treino do dia (ex.: no Inferior A da Yana, trocar o agachamento oferecia leg press/extensora, que já vêm depois).
   - Código: `TrocarExercicio` em `src/screens/TreinoMusculacao.tsx` e `alternativas()` em `src/engine/treinoAtivo.ts`.

3. **Plano da Yana começando com 3 × 10 (faixa 8–10) em todos os exercícios**
   - Hoje começa em 2 × 15. Reescrever a tabela `TABELA` em `src/data/planos.ts` a partir de 3 × 10 e progredir
     (ex.: 4 × 10 na construção, 4 × 8–10 na intensificação; recuperações com menos séries) e ajustar `src/data/planos.test.ts`.
