# Câmera

Nesta versão a câmera não força mais 1920x1080.

Ela tenta abrir usando a resolução real aproximada do celular:
- screen.width x devicePixelRatio
- screen.height x devicePixelRatio

Também tenta aplicar:
- foco contínuo;
- exposição contínua;
- balanço de branco contínuo;
- leve zoom se o aparelho permitir.

A resolução é pedida como `ideal`, não como `exact`, porque alguns celulares recusam resolução exata e a câmera deixa de abrir.
