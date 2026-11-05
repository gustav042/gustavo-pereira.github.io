// Perfis de exemplo. O que a pessoa salvar fica no localStorage e passa a valer no lugar disto.
// Coordenadas do quarto: área interna 192x160 px; parede vai de y=0 a 48, chão de 48 a 160.
// Itens de chão usam (x, y) do "pé" do móvel (a área que ocupa no chão).
window.QUARTINHO_DADOS = {
  perfis: {
    eu: {
      id: 'eu',
      nome: 'cinefilo_2003',
      humor: '😎 de boa, vendo filme',
      cidade: 'São Paulo, SP',
      sobre: 'oi! esse é meu quartinho. aqui guardo tudo que eu assisto. fique à vontade, só não mexe nos meus DVDs :P',
      avatar: '',
      corDestaque: '#ff66cc',
      papel: 'listras',
      piso: 'madeira',
      luz: 'dia',
      efeito: 'nenhum',
      musica: 'domingo',
      pet: { tipo: 'gato', cor: 'laranja', nome: 'Pipoca' },
      decorou: false,

      quarto: [
        { uid: 'e1', id: 'relogio', x: 12, y: 4, v: 'vermelho' },
        { uid: 'e2', id: 'mural', x: 40, y: 6 },
        { uid: 'e3', id: 'poster', x: 76, y: 6, slot: 0 },
        { uid: 'e4', id: 'poster', x: 96, y: 6, slot: 1 },
        { uid: 'e5', id: 'poster', x: 116, y: 6, slot: 2 },
        { uid: 'e6', id: 'janela', x: 136, y: 6, v: 'vermelho' },
        { uid: 'e7', id: 'trofeus', x: 168, y: 12, v: 'madeira' },
        { uid: 'e8', id: 'tapete', x: 64, y: 96, v: 'azul' },
        { uid: 'e9', id: 'estante', x: 0, y: 48, v: 'madeira' },
        { uid: 'e10', id: 'planta', x: 36, y: 48, v: 'terracota' },
        { uid: 'e11', id: 'tv', x: 76, y: 48, v: 'escura' },
        { uid: 'e12', id: 'som', x: 112, y: 48, v: 'preto' },
        { uid: 'e13', id: 'pc', x: 136, y: 48, v: 'madeira' },
        { uid: 'e14', id: 'luminaria', x: 172, y: 48, v: 'amarelo' },
        { uid: 'e15', id: 'criado', x: 144, y: 96, v: 'madeira' },
        { uid: 'e16', id: 'cama', x: 160, y: 96, v: 'vermelho' },
        { uid: 'e17', id: 'pufe', x: 80, y: 112, v: 'amarelo' }
      ],

      posteres: [
        { titulo: 'Matrix', ano: 1999, cor: '#0f5132', imagem: '', motivo: 'Mudou meu jeito de ver filme de ação. E a internet.' },
        { titulo: 'A Viagem de Chihiro', ano: 2001, cor: '#b3364d', imagem: '', motivo: 'Assisto todo ano e sempre choro numa parte diferente.' },
        { titulo: 'Cidade de Deus', ano: 2002, cor: '#c77d1e', imagem: '', motivo: 'O melhor filme brasileiro, não aceito discussão.' }
      ],
      assistindo: { titulo: 'Lost', detalhe: 'Temporada 1 · Episódio 5', progresso: 40 },
      assistidos: [
        { titulo: 'Donnie Darko', ano: 2001, nota: 5, data: '2026-11-03' },
        { titulo: 'O Senhor dos Anéis', ano: 2001, nota: 5, data: '2026-10-30' },
        { titulo: 'Shrek', ano: 2001, nota: 4, data: '2026-10-28' },
        { titulo: 'Kill Bill', ano: 2003, nota: 4, data: '2026-10-21' },
        { titulo: 'Procurando Nemo', ano: 2003, nota: 4, data: '2026-10-19' },
        { titulo: 'Brilho Eterno', ano: 2004, nota: 5, data: '2026-10-12' },
        { titulo: 'Meninas Malvadas', ano: 2004, nota: 4, data: '2026-10-10' },
        { titulo: 'O Chamado', ano: 2002, nota: 3, data: '2026-10-05' },
        { titulo: 'Homem-Aranha', ano: 2002, nota: 4, data: '2026-09-28' },
        { titulo: 'Pânico 3', ano: 2000, nota: 2, data: '2026-09-20' }
      ],
      listas: [
        { nome: 'Quero ver', itens: ['Amélie', 'O Labirinto do Fauno', 'Oldboy'] },
        { nome: 'Pra sexta à noite', itens: ['Os Outros', 'Sinais', 'Extermínio'] }
      ],
      diario: [
        { data: '2026-11-03', texto: 'Revi Donnie Darko de madrugada. Péssima ideia, agora tô com medo de coelho.' },
        { data: '2026-10-30', texto: 'Maratona de Senhor dos Anéis versão estendida. 11 horas. Valeu cada minuto.' }
      ],
      recados: [
        { de: 'ana_luz', texto: 'que quarto lindo!!! me add', data: '2026-11-04' },
        { de: 'lucas.rox', texto: 'ainda tá com meu DVD do Matrix hein', data: '2026-11-01' },
        { de: 'bia_cinema', texto: 'bora ver Lost juntos sábado?', data: '2026-10-29' }
      ]
    },

    ana: {
      id: 'ana',
      nome: 'ana_luz',
      humor: '🌙 insone e feliz',
      cidade: 'Curitiba, PR',
      sobre: 'colecionadora de séries de conforto ✿ chá, cobertor e Gilmore Girls pela 4ª vez',
      avatar: '',
      corDestaque: '#b98cff',
      papel: 'estrelas',
      piso: 'carpete',
      luz: 'noite',
      efeito: 'vagalumes',
      musica: 'caixinha',
      pet: { tipo: 'coelho', cor: 'branco', nome: 'Algodão' },
      decorou: true,
      quarto: [
        { uid: 'a1', id: 'luzinhas', x: 0, y: 0, v: 'quente' },
        { uid: 'a2', id: 'luzinhas', x: 64, y: 0, v: 'quente' },
        { uid: 'a3', id: 'mural', x: 4, y: 6 },
        { uid: 'a4', id: 'poster', x: 40, y: 6, slot: 0 },
        { uid: 'a5', id: 'poster', x: 60, y: 6, slot: 1 },
        { uid: 'a6', id: 'poster', x: 80, y: 6, slot: 2 },
        { uid: 'a7', id: 'janela', x: 136, y: 6, v: 'roxo' },
        { uid: 'a8', id: 'neon', x: 172, y: 10, v: 'rosa' },
        { uid: 'a9', id: 'tapete', x: 72, y: 96, v: 'roxo' },
        { uid: 'a10', id: 'cama', x: 0, y: 48, v: 'rosa' },
        { uid: 'a11', id: 'criado', x: 32, y: 48, v: 'branca' },
        { uid: 'a12', id: 'tv', x: 56, y: 48, v: 'branca' },
        { uid: 'a13', id: 'som', x: 88, y: 48, v: 'prata' },
        { uid: 'a14', id: 'estante', x: 104, y: 48, v: 'branca' },
        { uid: 'a15', id: 'pc', x: 136, y: 48, v: 'branca' },
        { uid: 'a16', id: 'luminaria', x: 172, y: 48, v: 'rosa' },
        { uid: 'a17', id: 'poltrona', x: 136, y: 96, v: 'roxo' },
        { uid: 'a18', id: 'pufe', x: 88, y: 104, v: 'rosa' },
        { uid: 'a19', id: 'planta', x: 176, y: 128, v: 'branco' }
      ],
      posteres: [
        { titulo: 'Amélie', ano: 2001, cor: '#2f7a3a', imagem: '', motivo: 'Me ensinou a reparar nas coisas pequenas.' },
        { titulo: 'Orgulho e Preconceito', ano: 2005, cor: '#7a5aa8', imagem: '', motivo: 'A cena da chuva. Só isso.' },
        { titulo: 'Moulin Rouge', ano: 2001, cor: '#b0203a', imagem: '', motivo: 'Exagerado do jeito certo.' }
      ],
      assistindo: { titulo: 'Gilmore Girls', detalhe: 'Temporada 3 · Episódio 7', progresso: 65 },
      assistidos: [
        { titulo: 'Simplesmente Amor', ano: 2003, nota: 5, data: '2026-11-02' },
        { titulo: 'O Diário de Bridget Jones', ano: 2001, nota: 4, data: '2026-10-27' },
        { titulo: 'Encontros e Desencontros', ano: 2003, nota: 5, data: '2026-10-20' },
        { titulo: 'A Noiva Cadáver', ano: 2005, nota: 4, data: '2026-10-14' },
        { titulo: 'Os Excêntricos Tenenbaums', ano: 2001, nota: 4, data: '2026-10-08' }
      ],
      listas: [{ nome: 'Pra chorar no domingo', itens: ['Um Amor para Recordar', 'P.S. Eu Te Amo'] }],
      diario: [{ data: '2026-11-04', texto: 'Terminei a temporada 2 às 4 da manhã. Não me arrependo de nada.' }],
      recados: [{ de: 'cinefilo_2003', texto: 'seu quarto à noite é muito aconchegante!!', data: '2026-11-03' }]
    },

    lucas: {
      id: 'lucas',
      nome: 'lucas.rox',
      humor: '🎮 zerando tudo',
      cidade: 'Recife, PE',
      sobre: 'anime, filme de ação e fliperama. se o filme não tem explosão eu durmo.',
      avatar: '',
      corDestaque: '#ffb000',
      papel: 'tijolo',
      piso: 'xadrez',
      luz: 'tarde',
      efeito: 'nenhum',
      musica: 'fliperama',
      pet: { tipo: 'cachorro', cor: 'caramelo', nome: 'Bolacha' },
      decorou: true,
      quarto: [
        { uid: 'l1', id: 'poster', x: 8, y: 6, slot: 0 },
        { uid: 'l2', id: 'poster', x: 28, y: 6, slot: 1 },
        { uid: 'l3', id: 'poster', x: 48, y: 6, slot: 2 },
        { uid: 'l4', id: 'trofeus', x: 72, y: 16, v: 'escura' },
        { uid: 'l5', id: 'janela', x: 104, y: 6, v: 'azul' },
        { uid: 'l6', id: 'mural', x: 148, y: 6 },
        { uid: 'l7', id: 'relogio', x: 180, y: 8, v: 'preto' },
        { uid: 'l8', id: 'tapete', x: 56, y: 88, v: 'vermelho' },
        { uid: 'l9', id: 'tv', x: 8, y: 48, v: 'escura' },
        { uid: 'l10', id: 'som', x: 40, y: 48, v: 'vermelho' },
        { uid: 'l11', id: 'pc', x: 104, y: 48, v: 'escura' },
        { uid: 'l12', id: 'luminaria', x: 136, y: 48, v: 'cinza' },
        { uid: 'l13', id: 'poltrona', x: 16, y: 72, v: 'cinza' },
        { uid: 'l14', id: 'cama', x: 160, y: 64, v: 'azul' },
        { uid: 'l15', id: 'criado', x: 144, y: 64, v: 'escura' },
        { uid: 'l16', id: 'pufe', x: 72, y: 96, v: 'vermelho' },
        { uid: 'l17', id: 'estante', x: 0, y: 112, v: 'escura' },
        { uid: 'l18', id: 'planta', x: 176, y: 144, v: 'azul' }
      ],
      posteres: [
        { titulo: 'Akira', ano: 1988, cor: '#c0281e', imagem: '', motivo: 'A moto. A MOTO.' },
        { titulo: 'Matrix', ano: 1999, cor: '#0f5132', imagem: '', motivo: 'Melhor que o do cinefilo_2003, que tá com o MEU DVD.' },
        { titulo: 'Gladiador', ano: 2000, cor: '#a8761e', imagem: '', motivo: 'Chorei. Não conta pra ninguém.' }
      ],
      assistindo: { titulo: 'Dragon Ball Z', detalhe: 'Saga Cell · Ep. 165', progresso: 80 },
      assistidos: [
        { titulo: 'Velozes e Furiosos', ano: 2001, nota: 5, data: '2026-11-01' },
        { titulo: 'Piratas do Caribe', ano: 2003, nota: 5, data: '2026-10-25' },
        { titulo: 'Os Incríveis', ano: 2004, nota: 5, data: '2026-10-18' },
        { titulo: 'Van Helsing', ano: 2004, nota: 1, data: '2026-10-11' },
        { titulo: 'Kill Bill', ano: 2003, nota: 5, data: '2026-10-02' },
        { titulo: 'Batman Begins', ano: 2005, nota: 4, data: '2026-09-25' }
      ],
      listas: [{ nome: 'Só ação', itens: ['Duro de Matar', 'O Exterminador do Futuro 2'] }],
      diario: [{ data: '2026-10-11', texto: 'Van Helsing. Nunca mais.' }],
      recados: [{ de: 'cinefilo_2003', texto: 'vou devolver o DVD, juro', data: '2026-11-02' }]
    },

    bia: {
      id: 'bia',
      nome: 'bia_cinema',
      humor: '☁️ vendo sitcom e comendo pipoca doce',
      cidade: 'Belo Horizonte, MG',
      sobre: 'sitcom é terapia. aceito indicações de comédia romântica. NÃO aceito spoiler.',
      avatar: '',
      corDestaque: '#4fc3f7',
      papel: 'nuvens',
      piso: 'ladrilho',
      luz: 'dia',
      efeito: 'brilhos',
      musica: 'chuva',
      pet: { tipo: 'hamster', cor: 'dourado', nome: 'Paçoca' },
      decorou: true,
      quarto: [
        { uid: 'b1', id: 'relogio', x: 12, y: 4, v: 'azul' },
        { uid: 'b2', id: 'mural', x: 40, y: 6 },
        { uid: 'b3', id: 'poster', x: 76, y: 6, slot: 0 },
        { uid: 'b4', id: 'poster', x: 96, y: 6, slot: 1 },
        { uid: 'b5', id: 'poster', x: 116, y: 6, slot: 2 },
        { uid: 'b6', id: 'janela', x: 136, y: 6, v: 'azul' },
        { uid: 'b7', id: 'quadro', x: 172, y: 12, v: 'flor' },
        { uid: 'b8', id: 'tapete', x: 80, y: 100, v: 'azul', m: 'redondo' },
        { uid: 'b9', id: 'estante', x: 0, y: 48, v: 'branca' },
        { uid: 'b10', id: 'tv', x: 76, y: 48, v: 'branca' },
        { uid: 'b11', id: 'som', x: 112, y: 48, v: 'prata' },
        { uid: 'b12', id: 'pc', x: 136, y: 48, v: 'branca' },
        { uid: 'b13', id: 'planta', x: 176, y: 48, v: 'branco', m: 'flores' },
        { uid: 'b14', id: 'cama', x: 0, y: 96, v: 'azul', m: 'ferro' },
        { uid: 'b15', id: 'criado', x: 32, y: 96, v: 'branca', m: 'abajur' },
        { uid: 'b16', id: 'pufe', x: 120, y: 124, v: 'rosa', m: 'redondo' },
        { uid: 'b17', id: 'poltrona', x: 160, y: 120, v: 'azul', m: 'clube' }
      ],
      posteres: [
        { titulo: 'Harry e Sally', ano: 1989, cor: '#d4547a', imagem: '', motivo: 'O melhor diálogo de comédia romântica já escrito.' },
        { titulo: 'Clube dos Cinco', ano: 1985, cor: '#3a6ea5', imagem: '', motivo: 'Todo mundo é um pouco de cada um deles.' },
        { titulo: 'As Patricinhas de Beverly Hills', ano: 1995, cor: '#f2c94c', imagem: '', motivo: 'As if!' }
      ],
      assistindo: { titulo: 'Friends', detalhe: 'Temporada 5 · Episódio 10', progresso: 55 },
      assistidos: [
        { titulo: 'O Diabo Veste Prada', ano: 2006, nota: 5, data: '2026-11-05' },
        { titulo: 'Como Perder um Homem em 10 Dias', ano: 2003, nota: 4, data: '2026-11-03' },
        { titulo: 'De Repente 30', ano: 2004, nota: 5, data: '2026-10-31' },
        { titulo: 'Legalmente Loira', ano: 2001, nota: 4, data: '2026-10-24' },
        { titulo: 'O Chamado', ano: 2002, nota: 1, data: '2026-10-17' }
      ],
      listas: [{ nome: 'Conforto garantido', itens: ['Mamma Mia!', 'Mulan', 'O Casamento do Meu Melhor Amigo'] }],
      diario: [
        { data: '2026-11-05', texto: 'Vi O Diabo Veste Prada pela 6ª vez. A cena do suéter azul cerúleo continua impecável.' },
        { data: '2026-10-17', texto: 'Cedi à pressão e vi O Chamado. Dormi de luz acesa. Nunca mais.' }
      ],
      recados: [{ de: 'ana_luz', texto: 'bia empresta o box de Friends??', data: '2026-11-04' }]
    },

    joao: {
      id: 'joao',
      nome: 'joao_vhs',
      humor: '📼 rebobinando fita',
      cidade: 'Porto Alegre, RS',
      sobre: 'colecionador de VHS e de teorias da conspiração. a verdade está lá fora.',
      avatar: '',
      corDestaque: '#ff7043',
      papel: 'madeira',
      piso: 'carpete',
      luz: 'tarde',
      efeito: 'nenhum',
      musica: 'domingo',
      pet: { tipo: 'gato', cor: 'preto', nome: 'Breu' },
      decorou: true,
      quarto: [
        { uid: 'j1', id: 'poster', x: 8, y: 6, slot: 0 },
        { uid: 'j2', id: 'poster', x: 28, y: 6, slot: 1 },
        { uid: 'j3', id: 'poster', x: 48, y: 6, slot: 2 },
        { uid: 'j4', id: 'trofeus', x: 72, y: 4, v: 'escura' },
        { uid: 'j5', id: 'janela', x: 104, y: 6, v: 'amarelo' },
        { uid: 'j6', id: 'mural', x: 140, y: 6 },
        { uid: 'j7', id: 'relogio', x: 176, y: 8, v: 'preto' },
        { uid: 'j8', id: 'tapete', x: 48, y: 84, v: 'vermelho', m: 'passadeira' },
        { uid: 'j9', id: 'tv', x: 8, y: 48, v: 'escura' },
        { uid: 'j10', id: 'som', x: 40, y: 48, v: 'vermelho' },
        { uid: 'j11', id: 'guardaroupa', x: 64, y: 48, v: 'escura', m: 'arara' },
        { uid: 'j12', id: 'pc', x: 104, y: 48, v: 'escura' },
        { uid: 'j13', id: 'luminaria', x: 176, y: 48, v: 'roxo', m: 'lava' },
        { uid: 'j14', id: 'poltrona', x: 16, y: 72, v: 'vermelho', m: 'orelhuda' },
        { uid: 'j15', id: 'pufe', x: 112, y: 96, v: 'amarelo', m: 'quadrado' },
        { uid: 'j16', id: 'cama', x: 144, y: 128, v: 'amarelo', r: true },
        { uid: 'j17', id: 'estante', x: 0, y: 128, v: 'escura' }
      ],
      posteres: [
        { titulo: 'Alien', ano: 1979, cor: '#2b4a3a', imagem: '', motivo: 'Ninguém ouve você gritar. Mas eu ouvi.' },
        { titulo: 'De Volta para o Futuro', ano: 1985, cor: '#e0662a', imagem: '', motivo: 'Tenho a fita original com a capa rasgada.' },
        { titulo: 'O Iluminado', ano: 1980, cor: '#7a1f2b', imagem: '', motivo: 'Aquele carpete do hotel mora na minha cabeça.' }
      ],
      assistindo: { titulo: 'Arquivo X', detalhe: 'Temporada 2 · Episódio 3', progresso: 30 },
      assistidos: [
        { titulo: 'Sinais', ano: 2002, nota: 4, data: '2026-11-04' },
        { titulo: 'O Sexto Sentido', ano: 1999, nota: 5, data: '2026-11-01' },
        { titulo: 'Contatos Imediatos', ano: 1977, nota: 5, data: '2026-10-26' },
        { titulo: 'A Bruxa de Blair', ano: 1999, nota: 3, data: '2026-10-19' }
      ],
      listas: [{ nome: 'Fitas pra procurar no sebo', itens: ['Os Goonies', 'Gremlins', 'Labirinto'] }],
      diario: [{ data: '2026-11-04', texto: 'Sinais na fita VHS do sebo. A cena do aniversário no vídeo caseiro me pegou de novo.' }],
      recados: [{ de: 'lucas.rox', texto: 'me grava Akira em VHS??', data: '2026-11-03' }]
    }
  }
};
