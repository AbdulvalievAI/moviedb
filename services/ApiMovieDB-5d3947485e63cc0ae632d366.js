class ApiMovieDB {
    onCreate({ global, appInfo }) {
        this.global = global

        this._apiUrl = 'https://api.themoviedb.org/3'
        this._imagesUrl = 'https://image.tmdb.org/t/p'
        this._headers = {
            method: 'GET'
        }

        this._basicParams = {
            api_key: '^_^',
            include_adult: false,
            language: appInfo.get('device').deviceLocale
        }
    }

    getGenres() {
        const Genres = this.global.get('genres')
        if (Genres && Object.keys(Genres).length !== 0) return new Promise(resolve => resolve(Genres))
        const PathRequest = '/genre/movie/list'

        return this.fetch(PathRequest, this._basicParams).then(res => {
            const genresObj = {}
            res.genres.forEach(item => {
                genresObj[item.id] = item.name
            })
            this.global.set('genres', genresObj)
            return genresObj
        })
    }

    getMovies({ page }) {
        const PathRequest = '/discover/movie'
        const Params = {
            ...this._basicParams,
            page,
            sort_by: 'popularity.desc'
            // year: '2025'
        }

        const Filters = this.global.get('filters')
        if (Filters) {
            if (Filters.genres) Params.with_genres = Filters.genres.join()
            if (Filters.sort) Params.sort_by = Filters.sort.value
        }

        return this.fetch(PathRequest, Params)
    }

    searchMovies({ text, page }) {
        const PathRequest = '/search/movie'

        const Params = {
            ...this._basicParams,
            page,
            query: text
        }

        return this.fetch(PathRequest, Params)
    }

    getMovieDetails({ idMovie }) {
        const PathRequest = `/movie/${idMovie}`

        return this.fetch(PathRequest, this._basicParams)
    }

    getMovieImages({ idMovie }) {
        const PathRequest = `/movie/${idMovie}/images`
        const Params = {
            api_key: this._basicParams.api_key
        }
        // https://image.tmdb.org/t/p/original/wwemzKWzjKYJFfCeiB57q3r4Bcm.png
        // https://image.tmdb.org/t/p/w500/wwemzKWzjKYJFfCeiB57q3r4Bcm.png
        return this.fetch(PathRequest, Params)
    }

    async getVideos({ idMovie }) {
        const PathRequest = `/movie/${idMovie}/videos`

        const ResultDefaultGet = await this.fetch(PathRequest, this._basicParams)
        if (ResultDefaultGet && ResultDefaultGet.results && ResultDefaultGet.results.length) return ResultDefaultGet

        return this.fetch(PathRequest, {
            ...this._basicParams,
            ...{ language: 'en-US' }
        })
    }

    getCredits({ idMovie }) {
        const PathRequest = `/movie/${idMovie}/credits`
        const Params = {
            api_key: this._basicParams.api_key
        }
        return this.fetch(PathRequest, Params)
    }

    bindUrlImage({ width, path }) {
        if (width) {
            return `${this._imagesUrl}/w${width}${path}`
        }
        return `${this._imagesUrl}/original${path}`
    }

    fetch(pathRequest, params) {
        const UrlParams = new URLSearchParams(params)
        const ConcatUrl = `${this._apiUrl}${pathRequest}?${UrlParams.toString()}`
        return fetch(ConcatUrl, this._headers).then(res => res.json())
    }
}
