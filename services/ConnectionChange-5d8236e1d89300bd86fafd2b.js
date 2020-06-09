class ConnectionChange {
    onCreate({ notifier, translation, network }) {
        this.notifier = notifier
        this.translation = translation
        this.network = network
    }

    subscribeToEvent() {
        const handler = isConnected => {
            if (!isConnected) this.showMessage()
        }
        this.network.isConnected().then(handler)
        this.network.onConnectionChange(handler)
    }

    showMessage() {
        this.notifier.snackbar({
            msg: this.translation.get('No_internet_connection'),
            duration: 6000,
            actionLabel: this.translation.get('Close'),
            onActionClick: () => {
                this.notifier.hideSnackbar()
            }
        })
    }
}
