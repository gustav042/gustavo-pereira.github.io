# quartinho.net

Rede social retrô (estilo internet anos 2000) para acompanhar o que os amigos estão assistindo.
Cada perfil é um **quartinho** em pixel art (visão de cima 3/4) que a pessoa decora do jeito dela.

## Como rodar

HTML/CSS/JS puro, sem build. Sirva a pasta com qualquer servidor local:

```bash
npx http-server quartinho -p 5173 -c-1
```

e abra http://localhost:5173.

## Filmes e séries (TMDB)

A busca de títulos usa a API do [TMDB](https://www.themoviedb.org/). A chave do site fica em
`js/config.js` e vale pra todo mundo: ninguém precisa conectar nada.

Como o site não tem servidor, essa chave fica visível no código. Se alguém abusar, gere outra em
*themoviedb.org → Configurações → API* e troque no `js/config.js`. (Pra esconder de vez, dá pra mover
as chamadas pra uma Edge Function do Supabase.) Créditos ao TMDB ficam no rodapé, como os termos pedem.

## Contas de verdade (Supabase)

O site é estático (funciona no GitHub Pages). As contas, os perfis, os recados e as imagens ficam no
[Supabase](https://supabase.com), que o navegador acessa direto. Sem configurar (ou sem entrar numa
conta), o site funciona no **modo local**: um quartinho só seu, salvo no navegador, sem amigos.

1. Crie uma conta grátis em supabase.com e um **New project** (região *South America (São Paulo)*).
   Guarde a senha do banco que ele pede.
2. Abra **SQL Editor → New query**, cole todo o arquivo `supabase/schema.sql` e clique em **Run**.
   Isso cria as tabelas (`perfis`, `recados`, `seguindo`, `visitas_quarto`), o espaço de imagens e as regras de segurança.
   Se o banco já existia, rode `supabase/visitas.sql` para ativar a contagem compartilhada dos quartinhos.
   Se os comentários já estavam ativados, rode `supabase/comentarios.sql` de novo para liberar a edição dos próprios comentários.
3. Em **Authentication → URL Configuration**:
   - *Site URL*: `https://gustavo-pereira.github.io/quartinho/`
   - *Redirect URLs*: adicione também `http://127.0.0.1:5173/**` (pra testar no computador).
   É pra onde o link de confirmação do email leva a pessoa.
4. Em **Project Settings → API Keys**, aba **Legacy API Keys**, copie a chave *anon public* (começa com
   `eyJ`) para `js/supabase-config.js`, junto com a URL `https://<id-do-projeto>.supabase.co`. Essa chave pode ir pro GitHub: quem protege os dados são as regras do banco.
   **Nunca** coloque a chave `service_role` no site.

Depois disso aparece **👤 Entrar** no topo: dá pra criar conta (levando o quartinho do navegador junto),
procurar amigos pelo @usuario, seguir, visitar e deixar recados. O perfil salva sozinho na nuvem.
As visitas aos perfis com conta são contadas no banco e compartilhadas; no modo local, a contagem fica neste navegador.

Observação: no plano grátis, o Supabase pausa o projeto depois de uma semana sem nenhum acesso
(é só entrar no painel e reativar).

## O que já tem

- **Estatísticas (📊)**: gêneros favoritos, décadas, horas de filme, notas comparadas com a média do mundo,
  diretores, países e compatibilidade com os amigos. Os cartões aparecem no próprio quartinho e nos visitados,
  ao lado e abaixo do quarto; cada pessoa escolhe quais exibir em “Decorar e mudar a vibe”. A compatibilidade
  aparece apenas no próprio quarto, “Volta ao mundo” mostra os sete países mais frequentes com bandeiras
  do [Flagpedia](https://flagpedia.net/), e o gráfico por década mostra os títulos ao passar o mouse ou
  selecionar uma década. O gráfico se ajusta ao conteúdo (com rolagem horizontal quando necessário).
  “Gêneros mais bem avaliados” mostra as três maiores médias das notas pessoais (de 0,5 a 5),
  com a quantidade de títulos em cada gênero; empates são ordenados pela quantidade e depois pelo nome.
  Se já escolheu seus cartões, ative o novo em “Decorar e mudar a vibe”.
  Os quartinhos visitados também mostram seus seguidores. No rodapé, o
  contador mostra as visitas ao quartinho aberto. No computador, arraste diretamente os cartões de estatísticas
  e da lateral (ou use as setas do teclado na alça de cada cartão); “Restaurar posições dos cartões”
  desfaz a organização. As posições são salvas no perfil e aparecem para as visitas no desktop; no celular,
  os cartões seguem o layout automático. O estilo das caixas do blog também vale para as estatísticas do quarto.

- **Feed (🏠 Início)**: "o que você tá vendo?" (status / terminei de ver), mini TVs com o que cada amigo está
  assistindo, linha do tempo (assistiu, diário, recados) com notas de meia estrela, sinopses expansíveis,
  edição dos próprios posts e comentários, curtir, "+ quero ver" e "visitar quartinho",
  lista de amigos estilo MSN e "mais vistos pela galera". Endereços: `#feed`, `#quarto`, `#quarto/ana`, `#quarto/ana/mural`.

- **Quarto clicável**: pixel art com texturas, detalhes e sombras; estante de DVDs (filmes assistidos),
  pôsteres (favoritos), TV (assistindo agora), computador (listas e diário), mural (recados),
  prateleira de troféus (conquistas), aparelho de som (liga a música).
- **Listas de personagens**: no computador, busque nomes no Wikidata e adicione os resultados a qualquer
  lista. A busca também pode trazer obras ou pessoas, então confira a descrição antes de escolher.
  As listas aparecem como um livro de colagens. Fotos disponíveis no Wikimedia Commons aparecem com
  seus créditos e licença; também é possível enviar uma foto que você tenha permissão para usar.
  Os dados são do [Wikidata](https://www.wikidata.org/); não é necessária uma chave de API.
- **Importar Letterboxd**: na estante, escolha o CSV de avaliações ou cole seu conteúdo e confira a prévia
  antes de importar. Os registros existentes são preservados; a comparação usa link do Letterboxd, ID do
  TMDB ou título e ano. Sem correspondência exata no TMDB, filmes com nomes diferentes podem não ser
  identificados como duplicados e não entram nas estatísticas que dependem desses dados. A data importada
  é a do CSV de avaliações, que não é necessariamente a data em que o filme foi assistido.
- **Arrumar móveis**: arrastar, adicionar do catálogo, trocar modelo (3 de cama, tapete, assento, armário,
  criado-mudo, luminária e planta), trocar cor/material, girar (camas, tapetes e assentos) e remover.
  Atalhos: setas ajustam a posição, R gira, Delete tira do quarto.
- **Vibe**: papel de parede, chão, luz (dia, fim de tarde, noite, neon, com luminárias e telas brilhando à noite),
  efeitos (neve, corações, brilhinhos, vaga-lumes) e música do quarto.
- **Bichinho**: gato, cachorro, coelho ou hamster, com cor e nome. Ele anda pelo quarto desviando dos móveis; clique pra fazer carinho e ouvir um som chiptune.
- **Rádio**: 4 músicas chiptune originais, geradas com a Web Audio API (sem arquivos de áudio).
  A música escolhida começa ao entrar no quarto e para ao sair; em acessos diretos, o navegador pode
  exigir um clique ou uma tecla antes de liberar o som. A TV tem chiado opcional, sem vozes.
- **Blog personalizável (🎨)**: temas prontos, fundo da página (padrões em pixel, degradê, cor lisa ou imagem
  enviada), estilo das caixas (pixel, Windows 98, fofinho, neon, caderno, vidro Y2K), fonte, título animado
  (glitter, arco-íris, neon, 3D, ondinha), letreiro, cursor e rastro do mouse.
- **Stickers**: pixel art original, selinhos estilo "blinkie" (prontos ou com seu texto) e stickers com sua imagem.
  Dá pra arrastar, girar e mudar o tamanho; cada um fica preso no pedaço da página onde foi solto
  (título, quarto ou lateral), então continua no lugar certo no celular.
- **Amigos**: com conta, dá pra procurar pessoas pelo @usuario, seguir, ver quem te segue, descobrir pessoas para seguir no feed e receber notificações (🔔).

Os dados ficam no `localStorage` do navegador (ainda não há servidor/contas).

## Estrutura

```
quartinho/
  index.html
  css/estilo.css    visual retrô + janelas estilo Windows 98
  js/util.js        funções pequenas (escape de HTML, datas...)
  js/dados.js       perfil inicial (quarto mobiliado, sem filmes) de quem usa sem conta
  js/sprites.js     catálogo de móveis e bichinhos em pixel art
  js/musica.js      rádio chiptune
  js/feed.js        feed (início)
  js/blog.js        tema do blog (fundo, caixas, título, cursor) e stickers
  js/conta.js       contas no Supabase (login, perfis, recados, seguir, imagens)
  js/supabase-config.js  endereço e chave pública do projeto Supabase
  supabase/schema.sql    tabelas e regras de segurança do banco
  supabase/visitas.sql   migração do contador de visitas para bancos já existentes
  js/app.js         quarto, arrastar móveis, bichinho, janelas, navegação
  assets/           sprites/imagens de terceiros (ver abaixo)
```

## Usando sprites prontos

Cada móvel em `js/sprites.js` tem variantes. Para trocar o desenho por um sprite pronto, coloque a imagem
em `assets/` e adicione `imagem: 'assets/arquivo.png'` na variante. O sprite deve ter o tamanho `w` x `h` do item
(1 tile = 16 px). Respeite a licença de cada pacote: em geral **não é permitido redistribuir os arquivos brutos**,
então não suba a pasta `assets/` para um repositório público sem checar.
