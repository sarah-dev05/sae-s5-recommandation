# MUST - SAÉ S5 BUT 3 INFO 

Application web de recommandation de films : l'utilisateur choisit 3 à 5 films qu'il aime, l'application lui en recommande d'autres.

- Backend : Flask + SQLAlchemy + SQLite, API JSON (`app/`)
- Frontend : HTML / CSS / JavaScript natif (`frontend/`)

Dépôt : https://github.com/sarah-dev05/sae-s5-recommandation

## Installation

Python 3.12 recommandé.

```bash
git clone https://github.com/sarah-dev05/sae-s5-recommandation.git
cd sae-s5-recommandation
python3 -m venv .venv
source .venv/bin/activate        # Windows : .venv\Scripts\activate
pip install -r requirements.txt
```

## Lancement

Deux terminaux.

**1. Backend** (http://localhost:8000), depuis la racine du projet :

```bash
python3 main.py
```

Le premier démarrage prend un peu de temps (préparation du modèle de recommandation).

**2. Frontend** (http://localhost:5500) :

```bash
cd frontend
python3 -m http.server 5500
```

Puis ouvrir http://localhost:5500 dans le navigateur.

## Équipe

Les Loutres complices.
