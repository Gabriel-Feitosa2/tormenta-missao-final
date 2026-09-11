# Tormenta 20: Missão Final — Sistema de Parceiros de Arton

Aplicação fullstack em tempo real desenvolvida para a **Missão Final** da campanha de **Tormenta 20**, implementando fielmente as regras especiais de Parceiros do suplemento da aventura final.

---

## 🩸 Características Principais

- **Tempo Real com WebSockets (Socket.io)**: Sincronização instantânea entre o Mestre e os 5 Jogadores em qualquer dispositivo (celular, tablet ou computador).
- **Catálogo Integral dos 34 NPCs do PDF**:
  - Todos os parceiros cadastrados com valores de Vontade, fórmulas de ataque, bônus passivos/ativos, marcadores de Curandeiro e Íntimo (*).
  - Todos equipados com **Aço Rubi** do Coração da Montanha (ignoram Redução de Dano dos lefeus).
  - Imunidade automática para **Masaru** e **Adaga**.
- **Controle e Teste de Vontade da Tormenta em Massa**:
  - O Mestre define a CD e dispara o teste para parceiros ativos ou todos os 34 da mesa.
  - Rolagens animadas com 1d20 + Vontade em tempo real.
  - **Contador de 3 Falhas**: cada falha é marcada visualmente (caveiras rubras); ao atingir 3 falhas, o parceiro sucumbe à Tormenta, morre e fica inutilizável. O Mestre tem controle manual para ajustar falhas ou reviver.
- **Draft & Troca de Parceiros**:
  - Cada parceiro pertence a 1 jogador por vez (exclusivo).
  - Limite estrito de até **8 parceiros** por jogador.
  - Botão de **Passar / Transferir Parceiro** durante o combate.
- **Automação Completa de Combate do PDF**:
  - **Fim de Turno do Jogador (1d8 de Ferimento)**: O jogador marca quais parceiros deram ordens na rodada e clica em "Finalizar Turno". O sistema rola 1d8: se for $\le$ parceiros usados, sorteia aleatoriamente um deles para o estado **Ferido (Fora de Combate)**.
  - **Fim de Onda de Ataques**: O Mestre aciona a rolagem de sobrevivência dos feridos (dado ímpar = morre; dado par = sobrevive ferido até receber cura).
  - **Ataques dos Parceiros**: Botões de ataque com rolagem de dados imediata (ex: 3d6, 4d8+4, 6d12, etc.).
  - **Cura**: Botão para curar feridos e trazê-los de volta à ativa.
  - **Habilidades Especiais**:
    - **Borus\***: Modo Lobisomem (+4 ataque, +2d6 dano cc, ataque vira 6d8+6; teste de 1d10 ao fim do turno para perda de controle).
    - **Rizzelena\***: Custo de 2 PM para rolar 1d6 na Tabela de Comidas completa.
    - **Lisandra\***: Seleção de um dos 5 efeitos lendários da Força da Natureza a cada rodada.
    - **Khorr'benn\***: Bênção de Thyatis (imortalidade na lore).
- **Persistência Automática em Disco**:
  - Todo o estado (draft, ferimentos, falhas de vontade, histórico de logs) é salvo em `server/data/session.json` instantaneamente. Recarregar a página ou reiniciar o servidor não perde o progresso da mesa!
- **Estética Medieval Sombria de Tormenta**:
  - Paleta vermelho-rubi/sangue, tipografia temática medieval (Cinzel, Pirata One, Crimson Text), animações de dados e corrupção, totalmente silenciosa (sem áudio).

---

## 🚀 Como Executar

### Pré-requisitos
- Node.js instalado (v18 ou superior).

### Instalação rápida
No diretório do projeto:
```bash
npm install
npm install --prefix client
```

### Execução em Modo de Produção (Recomendado para jogar)
Inicia o servidor completo na porta 3001, servindo o backend e frontend juntos:
```bash
npm start
```
Acesse no navegador:
👉 **`http://localhost:3001`**

### Execução em Modo de Desenvolvimento (Live Reload)
```bash
npm run dev
```
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

---

## 👥 Como Jogar na Sessão

1. **Mestre**:
   - Clique em **"Entrar como Mestre"**.
   - Digite o PIN: `tormenta20` (padrão).
   - Defina a CD da Tormenta, acompanhe a distribuição dos parceiros e dispare os testes em massa quando a Tormenta atacar.
2. **Jogadores (5 Slots)**:
   - Cada jogador entra no link (via rede Wi-Fi local ou túnel como ngrok/Cloudflare) e escolhe seu slot (**Jogador 1 a 5**).
   - Pode clicar no ícone de lápis para personalizar seu nome e o nome do seu personagem de Tormenta.
   - Abre o catálogo de **Recrutar** e escolhe até 8 parceiros.
   - Durante sua rodada, marca quem deu ordens, rola seus ataques e clica em **"Finalizar Turno"** para rolar o 1d8 de ferimento!
