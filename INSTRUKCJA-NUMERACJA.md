# Górnik Radlin — numeracja i partie dostawcy

## Co zmienia aktualizacja

- Znika wybór i generowanie inicjałów. Nie są zapisywane w **nowych** zgłoszeniach.
- Automatyczny numer zawodnika przy zamówieniu: Skrzat 101–199, Żak 201–299, Orlik 301–399, Młodzik 401–499, Trampkarz 501–599, Junior Młodszy 601–699, Junior Starszy 701–799. Roczniki w ramach kategorii współdzielą pulę.
- Jedna osoba = jeden numer dla wszystkich trzech elementów pakietu.
- Wcześniejsze zgłoszenia **nie dostają numerów automatycznie**: w panelu trenerów jest osobny przycisk „Nadaj brakujące numery”. Najpierw usuń zgłoszenia testowe, jeśli nie chcesz przydzielać im numerów.
- Usunięcie roboczego zgłoszenia zwalnia numer; edycja grupy do innej kategorii zmienia numer, ale edycja rozmiaru i płatności nie.
- „Zatwierdź partię” blokuje edycję i usuwanie zamówień tej partii, zachowując możliwość oznaczania płatności. Kolejne zgłoszenia pozostają robocze aż do zatwierdzenia następnej partii.
- Panel i Excel pokazują numer i partię. Excel zawiera arkusze „Zamówienia”, „Dla dostawcy”, „Zestawienie”. **Przed wysłaniem dostawcy wybierz konkretną zatwierdzoną partię w filtrze**.
- Dotychczasowe dokumenty MongoDB, w tym historyczne pola inicjałów, pozostają bez ingerencji (na stronie i w Excelu inicjały nie są używane).

## Instalacja w GitHub Codespaces

1. Zapisz aktualny stan w Git / zrób backup. Uruchom `git status`.
2. Prześlij paczkę `dresy-numery-update.zip` do katalogu projektu w Codespaces i wykonaj:

   ```bash
   unzip -o dresy-numery-update.zip
   rm src/lib/initials.ts
   ```

3. Nie nadpisuj `.env.local`; paczka go nie zawiera. Nie uruchamiaj jeszcze `git push`.
4. Uruchom:

   ```bash
   npx prettier --write src
   npx next typegen
   npx tsc --noEmit && npm run lint && npm run build
   ```

5. Testy wykonuj na **osobnej bazie testowej MongoDB Atlas**, a nie na bazie produkcyjnej. MongoDB musi obsługiwać transakcje (Atlas replica set). Sprawdź, czy `MONGODB_DB` wskazuje bazę testową, zanim zapiszesz zgłoszenia.

## Scenariusz testów przed wdrożeniem

1. Pierwszy Skrzat → 101. Pierwszy Żak → 201. Kolejny Żak z innego rocznika → 202. Wygenerowanie kolejnego zgłoszenia z tym samym idempotency key nie tworzy drugiego wpisu.
2. Usunięcie roboczego Żaka z numerem 201 → następny Żak powinien otrzymać 201.
3. Zmiana grupy roboczego zawodnika z Żak na Orlik zmienia zakres numeru, ale nie kasuje zamówienia.
4. W panelu nowe osoby mają numery; starsze testowe (jeśli są) dostają numery dopiero po kliknięciu „Nadaj brakujące numery”.
5. „Zatwierdź partię” blokuje usuwanie i edytowanie jej zawodników **również w API**, natomiast zmiana płatności jest możliwa.
6. Nowy zawodnik po zatwierdzeniu trafia do „Roboczych” i otrzymuje pierwszy wolny numer z właściwej puli. Kolejne zatwierdzenie tworzy Partię 2.
7. Filtr „Partia 1” → Excel: każda z trzech części ma ten sam numer zawodnika, właściwy kod Joma i oznaczenie Partii 1. Nie wysyłaj do dostawcy eksportu „Wszystkie partie”, jeśli zawiera robocze zamówienia.

## Uwagi bezpieczeństwa

- Przydziały numerów wykorzystują osobną kolekcję `number_slots`, a zapis, przeniesienie, zwolnienie i zatwierdzenie numerów odbywają się w transakcjach MongoDB.
- Nie edytuj ręcznie `number_slots`, `numbering_control` ani `approved_batches` w MongoDB.
- Nie uruchamiaj `git add .` — w katalogu mogą być nieprzeznaczone do repozytorium pliki ZIP. Po testach użyj `git add -A src` i sprawdź `git diff --cached --stat` oraz `git status`.
- Nie publikuj bez pozytywnych wyników `tsc`, `lint`, `build` i testów operacji na bazie.
