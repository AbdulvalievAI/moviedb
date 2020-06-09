class DateConversion {
    onCreate({ logger }) {
        this.logger = logger
    }

    conversion({ date = new Date(), editTime }) {
        let dateObj = date
        if (typeof date === 'string') dateObj = new Date(date)
        if (typeof date === 'number') dateObj = new Date(date * 1000)
        const twoChart = number => {
            if (number < 10) return `0${number}`
            return number
        }

        if (editTime) {
            switch (editTime) {
                case 'start':
                    dateObj.setHours(0, 0, 0, 0)
                    break
                case 'end':
                    dateObj.setHours(23, 59, 59, 999)
                    break
                default:
                    this.logger.warn(`conversion - Неизвестный тип editTime: ${editTime}`)
            }
        }

        const resultObj = {
            dd: twoChart(dateObj.getDate()),
            mn: twoChart(dateObj.getMonth() + 1),
            gggg: dateObj.getFullYear(),
            hh: twoChart(dateObj.getHours()),
            mm: twoChart(dateObj.getMinutes())
        }
        return {
            dateObj,
            date: `${resultObj.dd}.${resultObj.mn}.${resultObj.gggg}`,
            dateTime: `${resultObj.dd}.${resultObj.mn}.${resultObj.gggg} ${resultObj.hh}:${resultObj.mm}`,
            unixTime: Math.floor(dateObj.getTime() / 1000)
        }
    }
}
