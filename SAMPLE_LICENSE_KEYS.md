# Przykładowe klucze licencyjne do testowania

## Licencja BASIC (max 2 przeglądarki)

```
BXYZ-1234-ABCD-5678
BASIC-TEST-1234-5678
B000-0000-0000-0001
B111-2222-3333-4444
BABC-DEF0-1234-5678
```

## Licencja GOLD (max 4 przeglądarki)

```
GXYZ-1234-ABCD-5678
GOLD-TEST-1234-5678
G000-0000-0000-0001
G111-2222-3333-4444
GABC-DEF0-1234-5678
```

## Uwagi

- Wszystkie klucze muszą mieć format: `XXXX-XXXX-XXXX-XXXX`
- Pierwszy znak określa typ licencji:
  - `B` = BASIC (2 przeglądarki)
  - `G` = GOLD (4 przeglądarki)
  - Inne litery = BASIC (domyślnie)
- Klucze są tylko do testów - w produkcji należy użyć systemu generowania kluczy
- Klucz jest powiązany z Machine ID komputera (nie można przenosić między maszynami)
