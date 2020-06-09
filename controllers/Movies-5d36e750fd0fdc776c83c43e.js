class Movies {
    async onCreate({ view, logger, navigator, apiMovieDB, exceptions, connectionChange /* , notifier, favorites */ }) {
        this.view = view
        this.logger = logger
        this.navigator = navigator
        /* this.notifier = notifier */
        /* this.favorites = favorites */

        this.apiMovieDB = apiMovieDB
        this.exceptions = exceptions

        this.page = 1
        this.totalPages = null
        this.genres = null
        this.isSearchOpen = false
        this.isSearch = false
        this.onSubmitSearchClick = false
        this.isErrorGetMovies = false
        this.typesViewList = {
            typeOne: {
                iconAppBar: 'view-list',
                widthPoster: 200,
                keyPoster: 'poster_path',
                twoKeyPoster: 'backdrop_path',
                idList: 'moviesViewList'
            },
            typeTwo: {
                iconAppBar: 'view-agenda',
                widthPoster: 500,
                keyPoster: 'backdrop_path',
                twoKeyPoster: 'poster_path',
                idList: 'moviesFullscreenList'
            },
            typeThree: {
                iconAppBar: 'view-grid',
                widthPoster: 200,
                keyPoster: 'poster_path',
                twoKeyPoster: 'backdrop_path',
                idList: 'moviesGridList'
            },
            typeFour: {
                iconAppBar: 'solar-panel-large',
                widthPoster: 200,
                keyPoster: 'poster_path',
                twoKeyPoster: 'backdrop_path',
                idList: 'moviesComfyList'
            }
        }
        this.currentActiveType = 'typeOne'
        this.fetchAllDataError = null

        this.appbar = this.view.getComponent('appbar')
        this.emptyListLbl = this.view.getComponent('emptyListLbl')

        this.dataMovies = []
        this.isBindsLists = {
            moviesFullscreenList: false,
            moviesGridList: false,
            moviesComfyList: false,
            moviesViewList: false
        }

        this.fetchAllData = async ({ ifResetPage }) => { // TODO вынести в метод(this.fetchAllData.bind(this))
            if (this.isErrorOnEndReached || !this.totalPages || this.page < this.totalPages) {
                try {
                    if (!this.genres) await this.fetchGenres()

                    this.getActiveList().setRefreshState(true)

                    const ResFetchMovies = await this.fetchMovies({ ifResetPage })
                    this.getActiveList().setRefreshState(false)

                    if (this.page > 1) {
                        this.getActiveList().addData(ResFetchMovies)
                        this.dataMovies.push(...ResFetchMovies)
                    } else {
                        this.getActiveList().setData(ResFetchMovies)
                        this.dataMovies = ResFetchMovies
                    }
                    this.fetchAllDataError = false
                } catch (err) {
                    this.fetchAllDataError = true
                    this.exceptions.error(err)

                    // this.getActiveList().clearData()
                    if (!this.dataMovies.length) this.emptyListLbl.setAttrs({ visibility: true })
                    this.getActiveList().setRefreshState(false)
                    throw err
                }
            }
        }

        connectionChange.subscribeToEvent()
        this.bindAppbar()
        this.bindEmptyListLbl()
        this.bindList()
        this.fetchAllData({})
    }

    getActiveList() {
        return this.view.getComponent(this.typesViewList[this.currentActiveType].idList)
    }

    bindAppbar() {
        const AppbarOnLeftIconClickFunc = async () => {
            this.appbar.setAttrs({ leftIcon: undefined })
            this.appbar.setAttrs({ value: '' })
            this.appbar.hideSearch()

            if (this.isSearch) {
                this.isSearch = false
                this.getActiveList().setRefreshState(true)

                this.fetchMovies({ ifResetPage: true })
                    .then(res => {
                        this.getActiveList().setRefreshState(false)
                        this.getActiveList().setData(res)
                        this.dataMovies = res
                    })
                    .catch(err => {
                        this.getActiveList().setRefreshState(false)
                        this.exceptions.error(err)
                    })
            }
        }
        const AppbarOnSubmit = async text => {
            if (text.trim().length >= 1) {
                this.isSearch = true
                this.textSearch = text
                this.onSubmitSearchClick = true

                this.getActiveList().setRefreshState(true)
                if (this.fetchAllDataError) await this.fetchAllData({})
                else {
                    try {
                        const res = await this.fetchMovies({ ifResetPage: true })
                        if (!res || !res.length) this.emptyListLbl.setAttrs({ visibility: true })
                        else this.emptyListLbl.setAttrs({ visibility: false })

                        this.getActiveList().setRefreshState(false)
                        this.getActiveList().setData(res)
                        this.dataMovies = res
                        this.onSubmitSearchClick = false
                    } catch (err) {
                        this.getActiveList().setRefreshState(false)
                        this.exceptions.error(err)
                        this.onSubmitSearchClick = false
                    }
                }
            }
        }

        const Elements = [
            {
                title: '{Search}',
                displayType: 'icon',
                icon: 'magnify',
                color: '#ECEFF1',
                id: 'searchBtn'
            },
            {
                title: '{Filters}',
                displayType: 'icon',
                icon: 'filter',
                color: '#ECEFF1',
                id: 'filterBtn'
            },
            {
                title: '{List_view}',
                displayType: 'icon',
                icon: 'view-agenda',
                color: '#ECEFF1',
                id: 'viewTypeBtn'
            }
        ]

        this.appbar.setAttrs({ elements: Elements })

        this.appbar.onMenuItemClick(id => {
            switch (id) {
                case 'viewTypeBtn':
                    this.getActiveList().clearData()
                    this.getActiveList().setAttrs({ visibility: false })
                    this.dataMovies = this.dataMovies.slice(0, 20)
                    this.page = 1

                    switch (this.currentActiveType) {
                        case 'typeOne':
                            this.currentActiveType = 'typeTwo'
                            Elements[2].icon = this.typesViewList.typeThree.iconAppBar
                            break
                        case 'typeTwo':
                            this.currentActiveType = 'typeThree'
                            Elements[2].icon = this.typesViewList.typeFour.iconAppBar
                            break
                        case 'typeThree':
                            this.currentActiveType = 'typeFour'
                            Elements[2].icon = this.typesViewList.typeOne.iconAppBar
                            break
                        case 'typeFour':
                            this.currentActiveType = 'typeOne'
                            Elements[2].icon = this.typesViewList.typeTwo.iconAppBar
                            break
                        default:
                            this.exceptions.error(
                                new Error(
                                    `view: Movies | action: onMenuItemClick | switch: viewTypeBtn | switch: this.currentActiveType = ${
                                        this.currentActiveType
                                    } - неизвестный кейс`
                                )
                            )
                    }

                    this.appbar.updateMenuItem(Elements[2])
                    this.bindList()
                    this.getActiveList().setData(this.dataMovies)
                    this.getActiveList().setAttrs({ visibility: true })
                    break
                case 'searchBtn':
                    this.appbar.setAttrs({ leftIcon: 'arrow-left' })
                    this.appbar.showSearch()
                    this.isSearchOpen = true
                    this.page = 1
                    break
                case 'filterBtn':
                    this.navigator.push({
                        id: 'PopupFilterMovies',
                        isPopup: true,
                        params: {
                            func: () => {
                                this.fetchAllData({ ifResetPage: true })
                            }
                        }
                    })
                    break
                default:
                    this.exceptions.error(
                        new Error(`view: Movies | action: onMenuItemClick | switch: id | id: ${id} - неизвестный кейс`)
                    )
            }
        })

        this.appbar.onLeftIconClick(AppbarOnLeftIconClickFunc)
        /*
        this.appbar.onChange({
            func: AppbarOnChange,
            debounce: 1000
        })
        */
        this.appbar.onSubmit(AppbarOnSubmit)
    }

    bindEmptyListLbl() {
        const ListSetOnRefreshFunc = async () => {
            this.emptyListLbl.setRefreshState(true)
            try {
                if (this.fetchAllDataError) await this.fetchAllData({})
                else {
                    const res = await this.fetchMovies({ ifResetPage: true })
                    this.emptyListLbl.setRefreshState(false)
                    this.getActiveList().setData(res)
                    this.dataMovies = res
                }
            } catch (err) {
                this.emptyListLbl.setRefreshState(false)
                this.exceptions.error(err)
            }
        }

        this.emptyListLbl.setOnRefresh(ListSetOnRefreshFunc)
    }

    bindList() {
        if (!this.isBindsLists[this.typesViewList[this.currentActiveType].idList]) {
            this.isBindsLists[this.typesViewList[this.currentActiveType].idList] = true
            const ListSetOnRefreshFunc = async () => {
                this.getActiveList().setRefreshState(true)
                try {
                    if (this.fetchAllDataError) await this.fetchAllData({})
                    else {
                        const res = await this.fetchMovies({ ifResetPage: true })
                        this.getActiveList().setRefreshState(false)
                        this.getActiveList().setData(res)
                        this.dataMovies = res
                    }
                } catch (err) {
                    this.getActiveList().setRefreshState(false)
                    this.exceptions.error(err)
                }

                /* this.fetchMovies({ ifResetPage: true })
                    .then(res => {
                        this.getActiveList().setRefreshState(false)
                        this.getActiveList().setData(res)
                        this.dataMovies = res
                    })
                    .catch(err => {
                        this.getActiveList().setRefreshState(false)
                        this.exceptions.error(err)
                    }) */
            }
            const ListSetOnEndReachedFunc = async () => {
                if (this.totalPages === this.page) return
                this.page += 1

                this.getActiveList().setRefreshState(true)
                this.fetchMovies({})
                    .then(res => {
                        this.getActiveList().setRefreshState(false)
                        this.getActiveList().addData(res)
                        this.dataMovies.push(...res)
                    })
                    .catch(err => {
                        this.getActiveList().setRefreshState(false)
                        this.exceptions.error(err)
                        this.page -= 1
                    })
            }

            const BindGenres = genreIds => {
                let resultString = ''
                genreIds.forEach((id, index) => {
                    if (index === 0) resultString += this.genres[id]
                    else resultString += `, ${this.genres[id]}`
                })
                return resultString
            }

            this.getActiveList().bindItem((data, item) => {
                if (
                    data[this.typesViewList[this.currentActiveType].keyPoster] ||
                    data[this.typesViewList[this.currentActiveType].twoKeyPoster]
                ) {
                    item.posterImg.setAttrs({
                        value: this.apiMovieDB.bindUrlImage({
                            width: this.typesViewList[this.currentActiveType].widthPoster,
                            path:
                                data[this.typesViewList[this.currentActiveType].keyPoster] ||
                                data[this.typesViewList[this.currentActiveType].twoKeyPoster]
                        })
                    })
                }

                if (this.currentActiveType === 'typeFour') {
                    if (data.title.length >= 13) item.nameLbl.setText(`${data.title.substr(0, 10).trim()}...`)
                    else item.nameLbl.setText(data.title)

                    if (String(data.title) === String(data.original_title))
                        item.originalNameLbl.setAttrs({ visibility: false })
                    else if (data.original_title.length >= 15)
                        item.originalNameLbl.setText(`${data.original_title.substr(0, 12).trim()}...`)
                    else item.originalNameLbl.setText(data.original_title)
                } else if (this.currentActiveType === 'typeThree') {
                    if (data.title.length >= 23) item.nameLbl.setText(`${data.title.substr(0, 20).trim()}...`)
                    else item.nameLbl.setText(data.title.trim())

                    if (String(data.title) === String(data.original_title))
                        item.originalNameLbl.setAttrs({ visibility: false })
                    else if (data.original_title.length >= 30)
                        item.originalNameLbl.setText(`${data.original_title.substr(0, 30).trim()}...`)
                    else item.originalNameLbl.setText(data.original_title)
                } else {
                    item.nameLbl.setText(data.title)
                    if (String(data.title) === String(data.original_title))
                        item.originalNameLbl.setAttrs({ visibility: false })
                    else item.originalNameLbl.setText(data.original_title)
                }

                if (this.currentActiveType === 'typeOne' || this.currentActiveType === 'typeTwo')
                    item.genreLbl.setText(BindGenres(data.genre_ids))

                if (
                    (this.currentActiveType === 'typeOne' || this.currentActiveType === 'typeTwo') &&
                    data.release_date
                ) {
                    const releaseDate = new Date(data.release_date).getFullYear()
                    item.releaseDateLbl.setText(String(releaseDate))
                }

                /*
                item.favoritesIcon.setAttrs({ value: this.favorites.getMovie({ idMovie: data.extId }) ? 'bookmark' : 'bookmark-outline' })
    
                item.favoritesIcon.onClick(() => {
                    // this.notifier.toast({ msg: 'Не реализовано', duration: 2000 })
                    item.favoritesPgs.setAttrs({ visibility: true })
                    item.favoritesIcon.setAttrs({ visibility: false })
                    if(this.favorites.getMovie({ idMovie: data.extId })) {
                        this.favorites.deleteMovie({ idMovie: data.extId })
                        .then(res => {
                            item.favoritesIcon.setAttrs({ value: 'bookmark-outline', visibility: true })
                            item.favoritesPgs.setAttrs({ visibility: false })
                            this.notifier.toast({ msg: 'Удалено из избранного.', duration: 3000 })
                        })
                        .catch(err => {
                            this.exceptions.error(err)
                            item.favoritesIcon.setAttrs({ visibility: true })
                            item.favoritesPgs.setAttrs({ visibility: false })
                        })
                    } else {
                        this.favorites.saveMovie({ objMovie: data })
                        .then(res => {
                            item.favoritesIcon.setAttrs({ value: 'bookmark', visibility: true })
                            item.favoritesPgs.setAttrs({ visibility: false })
                            this.notifier.toast({ msg: 'Добавлено в избранное.', duration: 3000 })
                        })
                        .catch(err => {
                            this.exceptions.error(err)
                            item.favoritesIcon.setAttrs({ visibility: true })
                            item.favoritesPgs.setAttrs({ visibility: false })
                        })
                        item.favoritesIcon.setAttrs({ value: 'bookmark'})
                    }
                })
                */
                if (data.vote_average) item.voteAverageLbl.setText(data.vote_average.toString())
                else item.voteAverageBlock.setAttrs({ visibility: false })
            })

            this.getActiveList().setOnRefresh(ListSetOnRefreshFunc)

            this.getActiveList().setOnEndReached(ListSetOnEndReachedFunc, 0)

            this.getActiveList().onItemClick(dataItem => {
                this.navigator.push({ id: 'Movie', params: dataItem })
            })
        }
    }

    fetchMovies({ ifResetPage }) {
        this.emptyListLbl.setAttrs({ visibility: false })
        if (ifResetPage) this.page = 1

        if (this.isSearch) {
            return this.apiMovieDB.searchMovies({ text: this.textSearch, page: this.page }).then(res => {
                if (this.page === 1 && (!res.results || !res.results.length)) return []

                this.totalPages = res.total_pages
                return res.results.map(item => Object.assign(item, { id: `${item.id}_${this.page}`, extId: item.id }))
            })
        }

        return this.apiMovieDB.getMovies({ page: this.page }).then(res => {
            if (!res.results || !res.results.length) this.emptyListLbl.setAttrs({ visibility: true })
            else this.emptyListLbl.setAttrs({ visibility: false })
            if (this.page === 1 && (!res.results || !res.results.length)) return []

            this.totalPages = res.total_pages
            return res.results.map(item => Object.assign(item, { id: `${item.id}_${this.page}`, extId: item.id }))
        })
    }

    fetchGenres() {
        return this.apiMovieDB.getGenres().then(res => {
            this.genres = res
        })
    }
}
