class PopupFilterMovies {
    onCreate({ view, global, navigator, translation }, data) {
        this.view = view
        this.global = global
        this.navigator = navigator
        this.data = data
        this.translation = translation

        this.genres = this.global.get('genres')
        this.filters = this.global.get('filters')
        this.newFilter = {}
        this.activeGenresBtn = {}
        this.sortReference = [
            {
                id: '1',
                title: `${this.translation.get('Popularity')} ▼`,
                value: 'popularity.desc'
            },
            {
                id: '2',
                title: `${this.translation.get('Popularity')} ▲`,
                value: 'popularity.asc'
            },
            {
                id: '3',
                title: `${this.translation.get('Date_of_release')} ▼`,
                value: 'release_date.desc'
            },
            {
                id: '4',
                title: `${this.translation.get('Date_of_release')} ▲`,
                value: 'release_date.asc'
            },
            {
                id: '5',
                title: `${this.translation.get('Revenue')} ▼`,
                value: 'revenue.desc'
            },
            {
                id: '6',
                title: `${this.translation.get('Revenue')} ▲`,
                value: 'revenue.asc'
            },
            {
                id: '7',
                title: `${this.translation.get('Rating')} ▼`,
                value: 'vote_average.desc'
            },
            {
                id: '8',
                title: `${this.translation.get('Rating')} ▲`,
                value: 'vote_average.asc'
            },
            {
                id: '9',
                title: `${this.translation.get('Number_of_ratings')} ▼`,
                value: 'vote_count.desc'
            },
            {
                id: '91',
                title: `${this.translation.get('Number_of_ratings')} ▲`,
                value: 'vote_count.asc'
            }
        ]

        this.bindGenresList()
        this.bindSortList()
        this.bindBottomMenu()
    }

    bindGenresList() {
        const GenresList = this.view.getComponent('genresList')

        const ActiveStylesBtn = {
            self: [
                {
                    width: 'auto',
                    backgroundColor: '#ECEFF1'
                }
            ],
            label: [
                {
                    color: '#263238',
                    fontSize: 10
                }
            ]
        }
        const DisableStylesBtn = {
            self: [
                {
                    width: 'auto',
                    backgroundColor: '#263238'
                }
            ],
            label: [
                {
                    color: '#ECEFF1',
                    fontSize: 10
                }
            ]
        }

        this.checkSelectedGenres = () => {
            this.view
                .getComponent('genresLbl')
                .setText(
                    this.newFilter.genres && this.newFilter.genres.length
                        ? `${this.translation.get('Genres')} (${this.newFilter.genres.length})`
                        : this.translation.get('Genres')
                )
        }
        this.clearGenres = () => {
            delete this.newFilter.genres
            this.checkSelectedGenres()
            Object.keys(this.activeGenresBtn).forEach(key => {
                this.activeGenresBtn[key].setAttrs({ styles: [DisableStylesBtn] })
            })
            this.activeGenresBtn = {}
        }

        if (this.filters && this.filters.genres && this.filters.genres.length)
            this.newFilter.genres = [...this.filters.genres]

        GenresList.bindItem((data, item) => {
            ;(() => {
                if (this.newFilter.genres && this.newFilter.genres.length) {
                    let isExistsGenre
                    this.newFilter.genres.find(id => {
                        if (String(id) === String(data.id)) {
                            isExistsGenre = true
                            return true
                        }
                        return false
                    })
                    if (isExistsGenre) this.activeGenresBtn[data.id] = item.genreBtn
                    item.genreBtn.setAttrs({ styles: [isExistsGenre ? ActiveStylesBtn : DisableStylesBtn] })
                } else {
                    item.genreBtn.setAttrs({ styles: [DisableStylesBtn] })
                }
                return true
            })()

            item.genreBtn.setAttrs({ title: data.value })

            item.genreBtn.onClick(() => {
                if (!this.newFilter.genres) {
                    this.newFilter.genres = [data.id]
                    item.genreBtn.setAttrs({ styles: [ActiveStylesBtn] })
                    this.activeGenresBtn[data.id] = item.genreBtn
                } else {
                    let isExistsGenre
                    let indexExistsGenre
                    this.newFilter.genres.find((id, index) => {
                        if (String(id) === String(data.id)) {
                            indexExistsGenre = index
                            isExistsGenre = true
                            return true
                        }
                        return false
                    })
                    if (isExistsGenre) {
                        item.genreBtn.setAttrs({ styles: [DisableStylesBtn] })
                        this.newFilter.genres.splice(indexExistsGenre, 1)
                        delete this.activeGenresBtn[data.id]
                    } else {
                        item.genreBtn.setAttrs({ styles: [ActiveStylesBtn] })
                        this.newFilter.genres.push(data.id)
                        this.activeGenresBtn[data.id] = item.genreBtn
                    }
                }

                if (!this.newFilter.genres.length) delete this.newFilter.genres

                this.checkSelectedGenres()
            })
        })

        this.checkSelectedGenres()
        if (this.genres) {
            const GenresMap = Object.keys(this.genres).map(key => ({
                id: key,
                value: this.genres[key]
            }))
            GenresList.setData(GenresMap)
        }
    }

    async bindSortList() {
        const SortList = this.view.getComponent('sortList')

        this.clearSort = () => {
            SortList.setValue('1')
            delete this.newFilter.sort
        }

        if (this.filters && this.filters.sort) this.newFilter.sort = { ...this.filters.sort }
        else this.newFilter.sort = this.sortReference.find(item => String(item.id) === '1')

        SortList.onSelect(item => {
            if (String(item.id) === '1') delete this.newFilter.sort
            else this.newFilter.sort = item
        })

        SortList.setData(this.sortReference)

        SortList.setValue(this.newFilter.sort.id)
    }

    bindBottomMenu() {
        this.view.getComponent('clearFilterBtn').onClick(() => {
            this.clearGenres()
            this.clearSort()
        })
        this.view.getComponent('applyFilterBtn').onClick(() => {
            if (Object.keys(this.newFilter).length) {
                this.global.set('filters', this.newFilter)
            } else {
                this.global.set('filters', undefined)
            }
            this.data.func()
            this.navigator.pop()
        })
    }
}
