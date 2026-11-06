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
   Isso cria as tabelas (`perfis`, `recados`, `seguindo`), o espaço de imagens e as regras de segurança.
3. Em **Authentication → URL Configuration**:
   - *Site URL*: `https://gustavo-pereira.github.io/quartinho/`
   - *Redirect URLs*: adicione também `http://127.0.0.1:5173/**` (pra testar no computador).
   É pra onde o link de confirmação do email leva a pessoa.
4. Em **Project Settings → API Keys**, aba **Legacy API Keys**, copie a chave *anon public* (começa com
   `eyJ`) para `js/supabase-config.js`, junto com a URL `https://<id-do-projeto>.supabase.co`. Essa chave pode ir pro GitHub: quem protege os dados são as regras do banco.
   **Nunca** coloque a chave `service_role` no site.

Depois disso aparece **👤 Entrar** no topo: dá pra criar conta (levando o quartinho do navegador junto),
procurar amigos pelo @usuario, seguir, visitar e deixar recados. O perfil salva sozinho na nuvem.

Observação: no plano grátis, o Supabase pausa o projeto depois de uma semana sem nenhum acesso
(é só entrar no painel e reativar).

## O que já tem

- **Estatísticas (📊)**: gêneros favoritos, décadas, horas de filme, notas comparadas com a média do mundo,
  diretores, países e compatibilidade com os amigos (também aparece na lista do MSN).

- **Feed (🏠 Início)**: "o que você tá vendo?" (status / terminei de ver), mini TVs com o que cada amigo está
  assistindo, linha do tempo (assistiu, diário, recados) com curtir, "+ quero ver" e "visitar quartinho",
  lista de amigos estilo MSN e "mais vistos pela galera". Endereços: `#feed`, `#quarto`, `#quarto/ana`, `#quarto/ana/mural`.

- **Quarto clicável**: estante de DVDs (filmes assistidos), pôsteres (favoritos), TV (assistindo agora),
  computador (listas e diário), mural (recados), prateleira de troféus (conquistas), aparelho de som (liga a música).
- **Arrumar móveis**: arrastar, adicionar do catálogo, trocar modelo (3 de cama, tapete, assento, armário,
  criado-mudo, luminária e planta), trocar cor/material, girar (camas, tapetes e assentos) e remover.
  Atalhos: setas ajustam a posição, R gira, Delete tira do quarto.
- **Vibe**: papel de parede, chão, luz (dia, fim de tarde, noite, neon, com luminárias e telas brilhando à noite),
  efeitos (neve, corações, brilhinhos, vaga-lumes) e música do quarto.
- **Bichinho**: gato, cachorro, coelho ou hamster, com cor e nome. Ele anda pelo quarto desviando dos móveis; clique pra fazer carinho.
- **Rádio**: 4 músicas chiptune originais, geradas com a Web Audio API (sem arquivos de áudio).
- **Blog personalizável (🎨)**: temas prontos, fundo da página (padrões em pixel, degradê, cor lisa ou imagem
  enviada), estilo das caixas (pixel, Windows 98, fofinho, neon, caderno, vidro Y2K), fonte, título animado
  (glitter, arco-íris, neon, 3D, ondinha), letreiro, cursor e rastro do mouse.
- **Stickers**: pixel art original, selinhos estilo "blinkie" (prontos ou com seu texto) e stickers com sua imagem.
  Dá pra arrastar, girar e mudar o tamanho; cada um fica preso no pedaço da página onde foi solto
  (título, quarto ou lateral), então continua no lugar certo no celular.
- **Amigos**: com conta, dá pra procurar pessoas pelo @usuario, seguir, ver quem te segue e receber notificações (🔔).

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
  js/app.js         quarto, arrastar móveis, bichinho, janelas, navegação
  assets/           sprites/imagens de terceiros (ver abaixo)
```

## Usando sprites prontos

Cada móvel em `js/sprites.js` tem variantes. Para trocar o desenho por um sprite pronto, coloque a imagem
em `assets/` e adicione `imagem: 'assets/arquivo.png'` na variante. O sprite deve ter o tamanho `w` x `h` do item
(1 tile = 16 px). Respeite a licença de cada pacote: em geral **não é permitido redistribuir os arquivos brutos**,
então não suba a pasta `assets/` para um repositório público sem checar.
