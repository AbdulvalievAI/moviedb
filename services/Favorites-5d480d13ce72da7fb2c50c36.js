class Favorites {
    onCreate({ prefs, exceptions }) {
        this.prefs = prefs

        this.favorites = prefs
            .get('favoritesMovies')
            .then(res => res || {})
            .catch(err => {
                exceptions.error(err)
            })
    }

    saveMovie({ objMovie }) {
        this.favorites[objMovie.extId] = objMovie
        return this.prefs.save({ favoritesMovies: this.favorites })
    }

    getAllMovies() {
        return this.favorites
    }

    getMovie({ idMovie }) {
        return this.favorites[idMovie]
    }

    deleteMovie({ idMovie }) {
        delete this.favorites[idMovie]
        return this.prefs.save({ favoritesMovies: this.favorites })
    }
}
