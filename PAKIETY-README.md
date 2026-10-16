# Górnik Radlin — pakiety, aktualizacja src

Źródło: archiwum dresy-pakiety-src.zip dostarczone 16.10.2026.

Nowa oferta: Pakiet I 425/223 zł (spodnie 100761.331, bluza 100947.703, kurtka 104796.700), Pakiet II 486/260 zł (te same spodnie/bluza, kurtka 105301.700).

Formularz umożliwia tylko zamówienie całych pakietów, z osobnymi rozmiarami trzech elementów. Każdy zawodnik w zamówieniu rodzinnym może mieć inny pakiet. Backend weryfikuje dokładnie trzy pozycje z danego pakietu, oblicza cenę po stronie serwera i zapisuje pakiet, cenę katalogową i kwotę do zapłaty jako historyczny zapis.

Zachowane: istniejące zamówienia pojedynczych produktów (tylko do podglądu/edycji w panelu), zabezpieczenia API, limity, historia wpłat, grupy, kalkulator rozmiarów. Panel i Excel rozpoznają pakiety i historyczne produkty.

Zdjęcia: kurtki korzystają z istniejących plików /public/images/*.png; dla spodni i bluzy są tymczasowo ikony, bo nie było ich zdjęć w archiwum.

WAŻNE: Nigdy nie publikuj zmian bez testów: `npx next typegen && npx tsc --noEmit && npm run lint && npm run build`, potem spróbuj zamówienia testowego w bezpiecznej bazie i eksportu XLSX. Jeśli używasz produkcyjnego MONGODB_URI, test tworzy realne zamówienie.

W Codespaces:
1) `git status` (nie nadpisuj niezapisanych zmian).
2) `cp -a src src-pakiety-backup` (kopia poza repo; nie commituj jej).
3) Wgraj ZIP do katalogu repo i: `unzip -o dresy-pakiety-update.zip`
4) Uruchom testy.
5) Przejrzyj `git diff` przed commitem.

Uwagi: Pełnego buildu Next.js nie wykonano w środowisku przygotowującym paczkę (brak package.json i node_modules w archiwum). Sprawdzono składnię 34 plików TS/TSX oraz cennik 223 + 260 = 483 zł.
