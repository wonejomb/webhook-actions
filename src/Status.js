module.exports = class Status {
    static Started = new Status({ color: 0x6aab11, friendlyName: 'Started' });
    static Success = new Status({ color: 0x11ab2a, friendlyName: 'Successful' });
    static Failed = new Status({ color: 0x82041d, friendlyName: 'Failed' });
    static Cancelled = new Status({ color: 0xeeb10e, friendlyName: 'Cancelled' });
    static Timedout = new Status({ color: 0x7290c1, friendlyName: 'Timed-Out' });

    constructor ({ color, friendlyName }) {
        this.color = color;
        this.friendlyName = friendlyName;
    }
}