// @flow
import React from 'react';
import type { Props } from './';
import compose from 'recompose/compose';
import { Loading } from 'src/components/loading';
import { Container, LinkWrapper, AvatarWrapper, Column } from './style';
import Activity from 'src/components/inboxThread/activity';
import { ThreadTitle } from 'src/components/inboxThread/style';
import { UserAvatar } from 'src/components/avatar';
import { withCurrentUser } from 'src/components/withCurrentUser';
import getThreadLink from 'src/helpers/get-thread-link';

class Attachment extends React.Component<Props> {
  render() {
    const { data, currentUser } = this.props;
    const { thread, loading, error } = data;

    if (loading)
      return (
        <div className="attachment-container">
          <Container style={{ padding: '16px 12px' }}>
            <Loading />
          </Container>
        </div>
      );
    if (error) return null;

    if (!thread) return null;

    return (
      <div className="attachment-container">
        <Container data-cy="thread-attachment">
          <LinkWrapper
            onClick={e => e.stopPropagation()}
            to={{ pathname: getThreadLink(thread) }}
          />
          <AvatarWrapper>
            <UserAvatar user={thread.author.user} size={32} />
          </AvatarWrapper>
          <Column>
            <ThreadTitle>{thread.content.title}</ThreadTitle>
            <Activity
              currentUser={currentUser}
              thread={thread}
              active={false}
            />
          </Column>
        </Container>
      </div>
    );
  }
}

export default compose(withCurrentUser)(Attachment);
