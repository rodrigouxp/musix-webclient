# Ícones do design system (Figma)

Uma cópia de cada variante do componente **Icon** do Figma (arquivo App-MUSIX, conjunto `6228:2651`). O nome do arquivo é o da variante (`type=home` vira `home.svg`).

- Todos usam `currentColor`: a cor vem do CSS (token), nunca do SVG. `delete` e `favorited` aparecem em `error/300` (`--color-error-300`) no Figma: aplique a cor pelo CSS.
- 24 x 24 com o glifo dentro de uma margem de 2 px (viewBox 24). `menu` e `close` têm 20 x 20.
- **Não edite** estes arquivos. Para mudar um ícone, altere no Figma e exporte de novo.
- As variantes `download`, `show`, `hide` e `ai` estão vazias no Figma (sem camadas) e por isso não têm arquivo aqui.
- **Exceção:** `ep-and-single.svg` foi refeito à mão a partir dos `vectorPaths` do Figma (disco de vinil: anel externo e anel interno de raio 4, traço 2), porque a exportação SVG do Figma perdeu o subcaminho do anel interno. Conferido pixel a pixel contra o screenshot do Figma. Os outros 39 arquivos foram conferidos do mesmo jeito e batem.
