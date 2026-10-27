# Latente — estúdio de vídeo com IA

Site institucional da Latente. HTML, CSS e JavaScript puros, sem build: basta servir a pasta.

## Estrutura

```
index.html                  página única
assets/css/style.css        estilos e tokens da marca
assets/js/latent-field.js   camada WebGL do hero (ruído → imagem, rastro de calor do cursor)
assets/js/main.js           abertura, rolagem, vídeos, prévia dos serviços, formulário
assets/fonts/               Anybody e Instrument Sans (variáveis, licença OFL)
assets/brand/               logotipo, símbolo e assinatura em SVG (versões clara e escura)
favicon.svg, apple-touch-icon.png, og.png
```

## Publicar no GitHub Pages

1. No repositório, abra **Settings → Pages**.
2. Em **Source**, escolha **Deploy from a branch**, branch `main`, pasta `/ (root)`, e salve.
3. Em um ou dois minutos o site fica em `https://thuliolf.github.io/agenciastudioia/`.

Para usar um domínio próprio, informe-o no mesmo painel e crie o registro DNS indicado pelo GitHub.

## Antes de ir ao ar

- **Contato:** edite `CONTATO` no topo de `assets/js/main.js` (e-mail e WhatsApp). O formulário abre o WhatsApp com a mensagem pronta quando o número estiver preenchido; sem número, abre o e-mail.
- **Vídeos e fotos:** são de demonstração, do [Pexels](https://www.pexels.com/license/) (uso comercial livre, sem atribuição obrigatória), carregados direto do CDN do Pexels. Substitua pelos vídeos próprios do estúdio trocando os atributos `src`, `data-src`, `data-preview` e `poster` em `index.html`. Para vídeos próprios, prefira hospedar os arquivos (MP4 H.264, 720p a 1080p) junto do site ou em um CDN.

## Identidade

| Token | Cor | Uso |
| --- | --- | --- |
| Breu | `#0A0722` | fundo |
| Ultravioleta | `#160B39` | superfícies |
| Magenta térmico | `#932667` | rampa de calor |
| Brasa | `#DD513A` | rampa de calor |
| Âmbar | `#FCA50A` | foco, destaque |
| Incandescente | `#FCFFA4` | ação principal |
| Névoa | `#F1EEF8` | texto |

A rampa de calor segue o mapa de cores *inferno*, usado em visualizações de modelos de IA, e só aparece para indicar progresso ou estado. O logotipo usa a Anybody com cada letra em uma largura do eixo `wdth` (50 a 150): a palavra interpola como um ponto no espaço latente.
