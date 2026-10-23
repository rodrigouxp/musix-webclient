# Ícones do design system (Figma)

Uma cópia de cada variante do componente **Icon** do Figma (arquivo App-MUSIX, conjunto `6228:2651`). O nome do arquivo é o da variante (`type=home` vira `home.svg`).

- Todos usam `currentColor`: a cor vem do CSS (token), nunca do SVG. `delete` e `favorited` aparecem em `error/300` (`--color-error-300`) no Figma: aplique a cor pelo CSS.
- 24 x 24 com o glifo dentro de uma margem de 2 px (viewBox 24). `menu` e `close` têm 20 x 20.
- **Não edite** estes arquivos. Para mudar um ícone, altere no Figma e exporte de novo.
- As variantes `download`, `show`, `hide` e `ai` continuam vazias no Figma (sem camadas) e por isso não têm arquivo aqui.
- **Exceção:** `ep-and-single.svg` foi refeito à mão a partir dos `vectorPaths` do Figma (disco de vinil: anel externo e anel interno de raio 4, traço 2), porque a exportação SVG do Figma continua perdendo o subcaminho do anel interno (o vetor tem 2 subcaminhos e o SVG exportado só 1). Conferido pixel a pixel contra o screenshot do Figma. Se mudar o desenho no Figma, refazer à mão.
- O Figma exporta `add`, `live-album` e `soundtrack` dentro de um `<g clip-path>` de 24 x 24 (igual ao viewBox, não corta nada). O wrapper é tirado ao copiar: `clipPath` dentro de um SVG escondido (`display: none`) não funciona em alguns navegadores e os `id` se repetiriam na página. A imagem renderizada é idêntica (conferido).
- `drag.svg`: o Figma agora exporta cada círculo em dois `<path>` (um de preenchimento, um de traço); o arquivo daqui tem o mesmo desenho num `<path>` por círculo (mesmos pontos). Não precisa trocar.
- **Conferido em 2026-10-23** contra o Figma (44 variantes): 40 SVGs aqui. Entraram `play` e `pause`; `add-to-queue` e `add-to-playlist` foram atualizados; saíram `location`, `message`, `phone` e `send` (não existem mais no Figma e nada no código os usava). `check` ainda não existe no Figma.
- Conferência: contagem de subcaminhos do vetor do Figma = a do SVG para todos (exceto o `ep-and-single`, acima) e render lado a lado com o screenshot do Figma.
