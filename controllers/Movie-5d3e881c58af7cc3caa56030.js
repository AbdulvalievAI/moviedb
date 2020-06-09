class Movie {
    onCreate({ view, apiMovieDB, exceptions, files, navigator, dateConversion, global, flags, intent }, data) {
        this.data = data
        this.view = view
        this.files = files
        this.navigator = navigator
        this.intent = intent

        this.exceptions = exceptions
        this.apiMovieDB = apiMovieDB
        this.dateConversion = dateConversion
        this.flags = flags
        this.genres = global.get('genres')

        this.generalView = this.view.getComponent('generalView')
        this.siteLbl = this.view.getComponent('siteLbl')

        this.bindAppBar()
        this.bindSwiper()
        this.bindVideosList()
        this.bindActorsList()
        this.bindCompaniesList()
        this.bindGeneralView()

        this.generalView.setRefreshState(true)
        this.bindView()
            .then(() => {
                this.generalView.setRefreshState(false)
            })
            .catch(() => {
                this.generalView.setRefreshState(false)
            })
    }

    bindGenres(genreIds) {
        let resultString = ''
        genreIds.forEach((id, index) => {
            if (index === 0) resultString += this.genres[id]
            else resultString += `, ${this.genres[id]}`
        })
        return resultString
    }

    bindSiteLbl(url) {
        if (url) {
            this.siteLbl.onClick(() => {
                this.intent.openURL(url).catch(err => {
                    this.exceptions.error(err)
                })
            })
        }
    }

    bindAppBar() {
        const Appbar = this.view.getComponent('appbar')

        Appbar.onLeftIconClick(() => {
            this.navigator.pop()
        })
        /*
        Appbar.onMenuItemClick(id => {
        })
        
        const Elements = [
            {
              title: "Избранное",
              displayType: "icon",
              icon: "bookmark-outline",
              color: "#ECEFF1",
              id: "favoritesBtn"
            }
        ]
        
        Appbar.setAttrs({ elements: Elements })
        */
    }

    bindSwiper() {
        const clicks = {}
        this.swiper = this.view.getComponent('swiper')
        this.swiperView = this.view.getComponent('swiperView')

        this.swiper.setAttrs({
            itemTemplate: {
                type: 'image',
                id: 'template',
                fit: 'cover',
                styles: [
                    {
                        self: [
                            {
                                width: '100%',
                                height: 170
                            }
                        ]
                    }
                ]
            }
        })

        this.swiper.bindItem((itemData, itemView, index) => {
            const state = itemView.template
            state.id = index
            state.value = itemData.value

            state.onClick(() => {
                if (!clicks[state.id]) {
                    clicks[state.id] = true
                    this.files
                        .open(this.apiMovieDB.bindUrlImage({ path: itemData.file_path }))
                        .catch(err => {
                            clicks[state.id] = false
                            this.exceptions.error(err)
                        })
                        .finally(() => {
                            setTimeout(() => {
                                clicks[state.id] = false
                            }, 1000)
                        })
                }
            })
        })
    }

    bindVideosList() {
        this.VideosList = this.view.getComponent('videosList')
        this.VideosList.bindItem((data, item) => {
            item.photo.setImage(`https://img.youtube.com/vi/${data.key}/default.jpg`)
            item.name.setText(`${data.name.substr(0, 20).trim()}...`)
        })

        this.VideosList.onItemClick(dataItem => {
            this.intent
                .openURL(`https://www.youtube.com/watch?v=${dataItem.key}`)
                .catch(err => this.exceptions.error(err))
        })
    }

    bindActorsList() {
        this.ActorsList = this.view.getComponent('actorsList')
        this.ActorsList.bindItem((data, item) => {
            if(data.name) item.name.setText(String(data.name))

            if (data.profile_path)
                item.photo.setImage(this.apiMovieDB.bindUrlImage({ width: 200, path: data.profile_path }))
        })

        this.ActorsList.onItemClick(item => {
            if (item.profile_path) {
                this.files
                    .open(this.apiMovieDB.bindUrlImage({ path: item.profile_path }))
                    .catch(err => this.exceptions.error(err))
            }
        })
    }

    bindCompaniesList() {
        this.CompaniesList = this.view.getComponent('companiesList')
        this.CompaniesList.bindItem((data, item) => {
            if(data.origin_country || data.name) item.name.setText(
                data.origin_country ? `${this.flags.getFlag(data.origin_country)} ${data.name}` : String(data.name)
            )

            if (data.logo_path && Boolean(data.logo_path))
                item.logo.setImage(this.apiMovieDB.bindUrlImage({ width: 400, path: data.logo_path }))
        })

        this.CompaniesList.onItemClick(item => {
            if (item.logo_path) {
                this.files
                    .open(this.apiMovieDB.bindUrlImage({ path: item.logo_path }))
                    .catch(err => this.exceptions.error(err))
            }
        })
    }

    bindView() {
        const promises = []
        const BindCountry = arr => {
            let resultString = ''
            arr.forEach((item, index) => {
                if (index === 0)
                    resultString +=
                        item.iso_3166_1 || item.iso_639_1
                            ? `${this.flags.getFlag(item.iso_3166_1 || item.iso_639_1)} ${item.name}`
                            : item.name
                else resultString += `, ${this.flags.getFlag(item.iso_3166_1 || item.iso_639_1)} ${item.name}`
            })
            return resultString
        }

        const GetTimeFromMins = mins => `${Math.trunc(mins / 60)}:${mins % 60}`

        const FormatMoney = num => num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1 ')

        if (this.data.vote_average) {
            this.view.getComponent('voteAverageLbl').setText(String(this.data.vote_average))
            this.view.getComponent('voteAverageBlock').setAttrs({ visibility: true })
        } else this.view.getComponent('voteAverageBlock').setAttrs({ visibility: false })

        if(this.data.title) this.view.getComponent('nameLbl').setText(String(this.data.title))

        if (this.data.genre_ids && this.data.genre_ids.length) {
            this.view.getComponent('genresLbl').setText(this.bindGenres(this.data.genre_ids))
            this.view.getComponent('genresLbl').setAttrs({ visibility: true })
        } else this.view.getComponent('genresLbl').setAttrs({ visibility: false })

        if (this.data.release_date) {
            this.view
                .getComponent('releaseDateLbl')
                .setText(this.dateConversion.conversion({ date: this.data.release_date }).date)
            this.view.getComponent('releaseDateBlock').setAttrs({ visibility: true })
        } else this.view.getComponent('releaseDateBlock').setAttrs({ visibility: false })

        if (this.data.original_title) {
            this.view.getComponent('originalNameLbl').setText(String(this.data.original_title))
            this.view.getComponent('originalNameLbl').setAttrs({ visibility: true })
        } else this.view.getComponent('originalNameLbl').setAttrs({ visibility: false })

        const getMovieImagesPromise = this.apiMovieDB
            .getMovieImages({ idMovie: this.data.extId })
            .then(movieImages => {
                if (!movieImages || movieImages.backdrops.length === 0) {
                    this.swiperView.setAttrs({ visibility: false })
                    return
                }

                this.swiper.setData(
                    movieImages.backdrops.splice(0, 10).map((item, index) => ({
                        id: index,
                        value: this.apiMovieDB.bindUrlImage({ width: 400, path: item.file_path }),
                        file_path: item.file_path
                    }))
                )
                this.swiperView.setAttrs({ visibility: true })
                this.view.getComponent('swiperPgsBlock').setAttrs({ visibility: false })
            })
            .catch(err => {
                this.exceptions.error(err)
                this.swiperView.setAttrs({ visibility: false })
                this.view.getComponent('swiperPgsBlock').setAttrs({ visibility: false })
            })
        promises.push(getMovieImagesPromise)

        const getVideosPromise = this.apiMovieDB
            .getVideos({ idMovie: this.data.extId })
            .then(videos => {
                if (videos && videos.results && videos.results.length) {
                    const trailersYouTube = []
                    videos.results.forEach(item => {
                        if (item.site === 'YouTube') trailersYouTube.push(item)
                    })
                    if (trailersYouTube.length) {
                        this.view.getComponent('videosTitleLbl').setAttrs({ visibility: true })
                        this.VideosList.setData(trailersYouTube)
                    } else {
                        this.view.getComponent('videosTitleLbl').setAttrs({ visibility: false })
                        this.VideosList.setAttrs({ visibility: false })
                    }
                } else {
                    this.view.getComponent('videosTitleLbl').setAttrs({ visibility: false })
                    this.VideosList.setAttrs({ visibility: false })
                }
                this.view.getComponent('videosPgsBlock').setAttrs({ visibility: false })
            })
            .catch(err => {
                this.exceptions.error(err)
                this.view.getComponent('videosPgsBlock').setAttrs({ visibility: false })
                this.view.getComponent('videosTitleLbl').setAttrs({ visibility: false })
                this.VideosList.setAttrs({ visibility: false })
            })
        promises.push(getVideosPromise)

        const getCreditsPromise = this.apiMovieDB
            .getCredits({ idMovie: this.data.extId })
            .then(credits => {
                if (credits && credits.cast && credits.cast.length) {
                    this.ActorsList.setData(credits.cast)
                    this.view.getComponent('actorsTitleLbl').setAttrs({ visibility: true })
                    this.ActorsList.setAttrs({ visibility: true })
                } else {
                    this.view.getComponent('actorsTitleLbl').setAttrs({ visibility: false })
                    this.ActorsList.setAttrs({ visibility: false })
                }
                this.view.getComponent('actorsPgsBlock').setAttrs({ visibility: false })
            })
            .catch(err => {
                this.exceptions.error(err)
                this.view.getComponent('actorsPgsBlock').setAttrs({ visibility: false })
                this.view.getComponent('actorsTitleLbl').setAttrs({ visibility: false })
                this.ActorsList.setAttrs({ visibility: false })
            })
        promises.push(getCreditsPromise)

        const getMovieDetailsPromise = this.apiMovieDB
            .getMovieDetails({ idMovie: this.data.extId })
            .then(movieDetails => {
                if (movieDetails.runtime) {
                    this.view.getComponent('runtimePgsBlock').setAttrs({ visibility: false })
                    this.view.getComponent('runtimeLbl').setText(String(GetTimeFromMins(movieDetails.runtime)))
                    this.view.getComponent('runtimeLbl').setAttrs({ visibility: true })
                    this.view.getComponent('runtimeBlock').setAttrs({ visibility: true })
                } else this.view.getComponent('runtimeBlock').setAttrs({ visibility: false })
                if (movieDetails.budget) {
                    this.view.getComponent('budgetPgsBlock').setAttrs({ visibility: false })
                    this.view.getComponent('budgetLbl').setText(String(FormatMoney(movieDetails.budget)))
                    this.view.getComponent('budgetLbl').setAttrs({ visibility: true })
                    this.view.getComponent('budgetBlock').setAttrs({ visibility: true })
                } else this.view.getComponent('budgetBlock').setAttrs({ visibility: false })
                if (movieDetails.revenue) {
                    this.view.getComponent('revenuePgsBlock').setAttrs({ visibility: false })
                    this.view.getComponent('revenueLbl').setText(String(FormatMoney(movieDetails.revenue)))
                    this.view.getComponent('revenueLbl').setAttrs({ visibility: true })
                    this.view.getComponent('revenueBlock').setAttrs({ visibility: true })
                } else this.view.getComponent('revenueBlock').setAttrs({ visibility: false })
                if (movieDetails.production_countries && movieDetails.production_countries.length) {
                    this.view.getComponent('countryPgsBlock').setAttrs({ visibility: false })
                    this.view.getComponent('countryLbl').setText(String(BindCountry(movieDetails.production_countries)))
                    this.view.getComponent('countryLbl').setAttrs({ visibility: true })
                    this.view.getComponent('countryBlock').setAttrs({ visibility: true })
                } else this.view.getComponent('countryBlock').setAttrs({ visibility: false })
                if (movieDetails.overview) {
                    this.view.getComponent('overviewLbl').setText(String(movieDetails.overview))
                    this.view.getComponent('overviewLbl').setAttrs({ visibility: true })
                } else this.view.getComponent('overviewLbl').setAttrs({ visibility: false })
                this.view.getComponent('overviewPgsBlock').setAttrs({ visibility: false })

                if (movieDetails.homepage) {
                    this.view.getComponent('sitePgsBlock').setAttrs({ visibility: false })
                    this.bindSiteLbl(movieDetails.homepage)
                    this.siteLbl.setText(String(movieDetails.homepage))
                    this.siteLbl.setAttrs({ visibility: true })
                    this.view.getComponent('siteBlock').setAttrs({ visibility: true })
                } else this.view.getComponent('siteBlock').setAttrs({ visibility: false })

                if (movieDetails.production_companies && movieDetails.production_companies.length) {
                    this.CompaniesList.setData(movieDetails.production_companies)
                    this.view.getComponent('companiesTitleLbl').setAttrs({ visibility: true })
                    this.CompaniesList.setAttrs({ visibility: true })
                } else {
                    this.view.getComponent('companiesTitleLbl').setAttrs({ visibility: false })
                    this.CompaniesList.setAttrs({ visibility: false })
                }
                this.view.getComponent('companiesPgsBlock').setAttrs({ visibility: false })
            })
            .catch(err => {
                this.exceptions.error(err)
                this.view.getComponent('runtimeBlock').setAttrs({ visibility: false })
                this.view.getComponent('budgetBlock').setAttrs({ visibility: false })
                this.view.getComponent('revenueBlock').setAttrs({ visibility: false })
                this.view.getComponent('countryBlock').setAttrs({ visibility: false })
                this.view.getComponent('overviewLbl').setAttrs({ visibility: false })
                this.view.getComponent('overviewPgsBlock').setAttrs({ visibility: false })
                this.view.getComponent('companiesTitleLbl').setAttrs({ visibility: false })
                this.CompaniesList.setAttrs({ visibility: false })
                this.view.getComponent('companiesPgsBlock').setAttrs({ visibility: false })
                this.view.getComponent('siteBlock').setAttrs({ visibility: false })
            })
        promises.push(getMovieDetailsPromise)

        return Promise.all(promises).then(res => res)
    }

    bindGeneralView() {
        this.generalView.setOnRefresh(async () => {
            this.generalView.setRefreshState(true)
            try {
                await this.bindView()
                this.generalView.setRefreshState(false)
            } catch (error) {
                this.generalView.setRefreshState(false)
            }
            /*
            await this.bindView()
                .then(() => GeneralView.setRefreshState(false))
                .catch(() => GeneralView.setRefreshState(false))
                */
        })
    }
}
