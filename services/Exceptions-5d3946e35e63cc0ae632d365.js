class Exceptions {
    onCreate({ logger, notifier, global, translation }) {
        this.logger = logger
        this.notifier = notifier
        this.global = global
        this.translation = translation
    }

    error(error, func) {
        console.log(error)
        // this.logger.error(error)
        this.notifier.hideProgress()
        // this.logger.error('code', error.code)
        // this.logger.error('message', error.message)
        if (error.code) {
            if (error.code === 401) {
                this.showMessage({
                    msg: this.translation.get('Access_error'),
                    duration: 6000
                })
                if (func) func()
                return
            }
            if (error.code === 500) {
                this.showMessage({
                    msg: this.translation.get('Server_error'),
                    duration: 6000
                })
                return
            }
        }
        if (error.message) {
            if (this.findText(error.message, 'Network request failed')) {
                this.showMessage({
                    msg: this.translation.get('Connection_error'),
                    duration: 6000
                })

                return
            }
            if (this.findText(error.message, "Can't open file")) {
                this.showMessage({
                    msg: this.translation.get('Error_open_file'),
                    duration: 6000
                })

                return
            }
            if (this.findText(error.message, 'Incorrect login or password')) {
                return
            }
            if (this.findText(error.message, 'Incorrect token')) {
                return
            }
            if (this.findText(error.message, 'Failed to fetch')) {
                this.showMessage({
                    msg: this.translation.get('Connection_error'),
                    duration: 6000
                })

                return
            }

            if (this.findText(error.message, 'Screen with id')) {
                return
            }
            this.showMessage({ msg: error.message })
            return
        }
        
        this.showMessage({
            msg: this.translation.get('Unknown_error')
        })
        
    }

    showMessage({ msg, duration }) {
        this.notifier.snackbar({
            msg,
            duration,
            actionLabel: this.translation.get('Close'),
            onActionClick: () => {
                this.notifier.hideSnackbar()
            }
        })
    }

    findText(text, targetText) {
        return text.toLowerCase().indexOf(targetText.toLowerCase()) > -1
    }
}
