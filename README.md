# Central de materiais — AnderLeads.IA

Site estático independente do Bob CRM. Node.js 22 ou superior, sem dependências npm, banco, credenciais ou serviços de rastreamento. Não é necessário executar `npm install`.

## Testar localmente

```powershell
cd C:\work-anderleads\ANDER-LEADS-MATERIAIS
npm run check
npm run dev
```

Abra http://localhost:4173. `dev` gera `dist/` e inicia o servidor; após alterar fontes, interrompa com Ctrl+C e execute novamente. `npm run build` gera o pacote e `npm run preview` serve o pacote existente. Para outra porta: `$env:PORT='4174'; npm run dev`.

Teste também o acesso direto e atualize cada URL no navegador:

- `/checklists/google-ads/`
- `/guias/google-ou-instagram/`
- `/tutoriais/flow-localizacao/`

Busca e filtros combinam categoria e palavras, ignoram acentos e apresentam estado vazio. Sem JavaScript a biblioteca e os links continuam disponíveis. Os materiais HTML abrem na mesma aba para preservar armazenamento local, impressão, clipboard e download; os links de retorno ficam no topo. O PDF tem leitura e download na página do guia.

## Estrutura e manutenção

- `catalog.json`: títulos, categorias, descrições, arquivos e mensagens de WhatsApp.
- `site/`: estilo, busca/filtros, favicon e imagem Open Graph PNG.
- `materials/`: **somente cópias públicas revisadas** dos três materiais. Esta pasta entra no Git.
- `scripts/build.mjs`: gera home, páginas estáticas, navegação nos HTMLs, 404, sitemap e robots.
- `scripts/serve.mjs`: servidor local sem fallback de SPA; rotas inexistentes respondem 404.
- `scripts/check.test.mjs`: valida links, SEO, número de WhatsApp, gerador Flow, 8 pontos iniciais e exclusão de arquivos internos.
- `scripts/prepare-materials.mjs`: importação explícita dos três originais; não roda no build ou deploy.
- `originals-audit.json`: hashes SHA-256 dos originais e das cópias revisadas.
- `dist/`: saída gerada; nunca editar nem versionar.

O build copia somente arquivos explícitos do site e arquivos listados no catálogo. Se houver arquivo inesperado em `dist/`, ele para: mova a pasta para backup e execute novamente. Isso impede que um arquivo privado antigo permaneça na saída.

Os originais na raiz permanecem intactos e ignorados no Git e no upload da Vercel. O laboratório `biblioteca_estilos_codex_remotion.html` está excluído de ambos, não é lido pelo importador nem copiado pelo build. Não coloque fontes internas em `materials/` ou `site/`.

### Diferenças das cópias públicas

- Checklist: links WhatsApp corrigidos para `5511915627350`. Preservados os 8 pontos iniciais **e as seções complementares**, marcações locais, limpeza e impressão.
- Flow: as cinco imagens originais (mapa, fachada, logo e capturas) são mantidas como exemplos por autorização expressa do proprietário. Um aviso orienta o visitante a usar suas próprias referências. Os campos de empresa e endereço começam vazios. Gerador, cópia e download preservados. Campos digitados ficam somente na página e não são enviados ao servidor.
- Guia PDF: cópia idêntica ao original, sem alterações.
- Build: adiciona navegação de retorno, WhatsApp e metadados às cópias HTML de saída.

Para reimportar após atualizar os originais, execute **localmente** e revise visualmente antes de publicar:

```powershell
node scripts/prepare-materials.mjs .
npm run check
```

O importador depende da estrutura atual dos documentos e recusa um tutorial com quantidade diferente de imagens. Alterações maiores exigem revisão do importador. Para conferir os originais: `Get-FileHash -Algorithm SHA256 *.html,*.pdf` e compare com `originals-audit.json`.

## Adicionar um material

1. Revise privacidade, links, scripts e dependências. Nunca copie pastas inteiras. Para HTML, incorpore as dependências locais ou amplie explicitamente a lista do build; não use conteúdo de clientes.
2. Coloque uma cópia revisada em `materials/` com nome simples, como `meu-guia.pdf`.
3. Duplique um registro em `catalog.json`. Use categoria `Guias`, `Checklists` ou `Tutoriais` e um `slug` único, como `guias/meu-guia`. `kind` deve ser `pdf` ou `html`; `file` deve ter a mesma extensão.
4. Preencha todos os campos e a mensagem personalizada. O número está centralizado em `whatsapp()` no build; para alterá-lo também revise os HTMLs públicos e o importador.
5. Execute `npm run check` e confira desktop, celular, links diretos e WhatsApp. Cards, filtros, páginas relacionadas e sitemap são gerados pelo catálogo. As ilustrações dos cards são decorativas, não capturas dos documentos.

## GitHub — somente quando autorizar

Crie um repositório vazio exclusivo para a central. Não use o repositório do Bob CRM. Os comandos abaixo são instruções; não foram executados.

```powershell
cd C:\work-anderleads\ANDER-LEADS-MATERIAIS
git init
git branch -M main
git add .gitignore .vercelignore package.json vercel.json README.md catalog.json originals-audit.json site materials scripts
git status --short
git diff --cached --stat
git diff --cached
git commit -m "Cria central de materiais AnderLeads.IA"
git remote add origin URL_DO_REPOSITORIO
git push -u origin main
```

Antes do commit, revise todo o conteúdo selecionado. `git check-ignore biblioteca_estilos_codex_remotion.html` deve listar o arquivo. `.gitignore` não protege arquivos já rastreados: se necessário retire-os do índice antes de publicar. Evite `git add .`.

## Vercel — somente quando autorizar

1. Importe o repositório exclusivo. Framework: **Other**; Root Directory: raiz deste projeto; Build Command: `npm run build`; Output Directory: `dist`; Node.js 22 ou 24. Não requer dependências.
2. Se a Vercel solicitar Install Command, use `node --version` (não há pacotes a instalar).
3. O site usará o endereço `vercel.app` fornecido. **Não configure domínio personalizado agora.**
4. O build usa `SITE_URL`, se definida; caso contrário usa `VERCEL_PROJECT_PRODUCTION_URL`, depois `VERCEL_URL`. Assim canonical, Open Graph e sitemap recebem automaticamente o endereço Vercel, sem domínio definitivo inventado. Em produção confira esses valores no HTML gerado. Em ambiente local usa `http://localhost:4173`.
5. Abra cada uma das três URLs diretamente, recarregue, teste o PDF, marque itens, limpe, imprima, gere um prompt, copie/baixe e confira os CTAs no celular. Clipboard requer HTTPS ou localhost; o tutorial conserva o fallback de seleção manual.

Alternativa pela CLI, **apenas após autorização**:

```powershell
npx vercel
# Quando aprovar a publicação de produção:
npx vercel --prod
```

Sem rewrites de SPA: cada URL tem `index.html` físico e funciona após refresh. `vercel.json` configura barra final, headers básicos e diretório público. Apenas `dist/` é servido. Não adicione bibliotecas externas sem revisar a Content Security Policy.

Quando configurar um domínio posteriormente, atualize `SITE_URL` com a origem HTTPS (sem caminhos) e gere novo deploy. Nenhum domínio foi configurado nesta entrega.

## Privacidade e acessibilidade

Sem formulários de captação, analytics, pixels ou fontes remotas. O checklist salva progresso em `localStorage` no próprio navegador; WhatsApp e Flow só abrem quando acionados. Links externos estão identificados e usam `noopener`. Navegação por teclado, foco visível, salto para conteúdo, filtros com `aria-pressed`, status de busca e redução de movimento estão incluídos. Testes automatizados não substituem uma auditoria formal de acessibilidade ou revisão editorial.

## Foto, identidade e Instagram

O símbolo oficial aparece no cabeçalho e rodapé; a foto de Ander Moraes fica na seção de apresentação depois da biblioteca, com WhatsApp e Instagram. As cópias `site/ander-moraes.png` e `site/anderleads-symbol.png` são idênticas aos PNGs fornecidos; enquadramento e escala são feitos por CSS. A foto usa carregamento sob demanda e dimensões declaradas. Os PNGs originais da raiz permanecem intactos e ignorados no Git/upload Vercel. A versão de logo com fundo e assinatura completa foi preservada como original; o símbolo transparente se adapta melhor ao cabeçalho.

## Contraste do tutorial Flow

`site/tutorial.css` alterna seções escuras e brancas (blocos 2, 4 e 6). Os blocos claros definem cores próprias para texto, prompt, botões, links, bordas e foco. O importador mantém o link da folha de estilos nas próximas importações. O original não é modificado.

## Seções claras no site inteiro

A home alterna apresentação escura, biblioteca branca, apresentação do Ander escura e instruções claras. As páginas de cada material têm área principal branca, cartão de contato escuro e relacionados claros. O checklist alterna os grupos de itens; progresso e CTA usam fundo branco. `site/checklist.css` controla a cópia pública e o importador preserva esses estilos. O tutorial mantém sua alternância em `site/tutorial.css`. Textos amarelos sobre branco foram substituídos por tons escuros, mantendo amarelo nos botões com letras pretas. Cabeçalho e rodapé continuam escuros para a identidade oficial.
